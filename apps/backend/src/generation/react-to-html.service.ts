import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { transformSync } from "@babel/core";
import * as crypto from "node:crypto";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as vm from "node:vm";
import { assertSafeComponentSource } from "./react-code-guard";

/**
 * Cheap text pre-filter run before the AST allowlist. This is defense-in-depth
 * only — the authoritative check is {@link assertSafeComponentSource}, which
 * blocks constructor/prototype escape gadgets that regexes cannot reliably catch.
 */
const BLOCKLIST: RegExp[] = [
  /\brequire\s*\(\s*['"]fs['"]\s*\)/,
  /\brequire\s*\(\s*['"]node:fs['"]\s*\)/,
  /\brequire\s*\(\s*['"]child_process['"]\s*\)/,
  /\brequire\s*\(\s*['"]node:child_process['"]\s*\)/,
  /\brequire\s*\(\s*['"]worker_threads['"]\s*\)/,
  /\brequire\s*\(\s*['"]vm['"]\s*\)/,
  /\brequire\s*\(\s*['"]node:vm['"]\s*\)/,
  /\brequire\s*\(\s*['"]net['"]\s*\)/,
  /\brequire\s*\(\s*['"]tls['"]\s*\)/,
  /\brequire\s*\(\s*['"]http['"]\s*\)/,
  /\brequire\s*\(\s*['"]https['"]\s*\)/,
  /\bprocess\./,
  /\bprocess\.deref\b/,
  /\bimport\s+[^;]*['"]fs['"]/,
  /\beval\s*\(/,
  /\bFunction\s*\(/,
  /\bnew\s+Function\b/,
  /\bwhile\s*\(\s*true\s*\)/,
  /\bfor\s*\(\s*;\s*;\s*\)/,
];

const COMPILE_CACHE = new Map<string, React.ComponentType<Record<string, unknown>>>();

function assertSafeSource(componentCode: string): void {
  for (const re of BLOCKLIST) {
    if (re.test(componentCode)) {
      throw new BadRequestException("Blocked pattern in generated component code.");
    }
  }
  // Authoritative check: positive AST allowlist that closes constructor/prototype
  // escape gadgets the regex pass above cannot reliably detect.
  assertSafeComponentSource(componentCode);
}

@Injectable()
export class ReactToHtmlService {
  validateCode(componentCode: string): void {
    assertSafeSource(componentCode);
  }

  /** Transpile JSX/TSX into an executable React component. Cached by sha256(componentCode). */
  compileComponent(componentCode: string): React.ComponentType<Record<string, unknown>> {
    this.validateCode(componentCode);
    const hash = crypto.createHash("sha256").update(componentCode, "utf8").digest("hex");
    const cached = COMPILE_CACHE.get(hash);
    if (cached !== undefined) return cached;

    let compiled: string | null | undefined;
    try {
      const result = transformSync(componentCode, {
        filename: "generated-email.tsx",
        presets: [
          ["@babel/preset-typescript", { isTSX: true, allExtensions: true }],
          [
            "@babel/preset-react",
            {
              runtime: "classic",
              pragma: "React.createElement",
              pragmaFrag: "React.Fragment",
            },
          ],
        ],
        plugins: ["@babel/plugin-transform-modules-commonjs"],
      });
      compiled = result?.code;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new BadRequestException(`Failed to transpile email component: ${msg}`);
    }

    if (!compiled?.trim()) {
      throw new BadRequestException("Transpilation produced empty output.");
    }

    type ModuleShape = { exports: { default?: React.ComponentType<Record<string, unknown>> } };
    const module: ModuleShape = { exports: {} };
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const reactEmail = require("@react-email/components") as Record<string, unknown>;
    const sandboxRequire = (id: string) => {
      if (id === "react") return React;
      if (id === "@react-email/components") return reactEmail;
      throw new Error(`Module not allowed: ${id}`);
    };

    // No host functions in the sandbox console: even a bound `console.error`
    // leaks the outer-realm `Function` via `.constructor`. Generated code has no
    // legitimate need to log, so these are inert no-ops.
    const sandboxConsole = { error() {}, warn() {}, log() {} };
    const context = vm.createContext({
      module,
      exports: module.exports,
      React,
      require: sandboxRequire,
      console: sandboxConsole,
      // Email components are pre-injected as globals so generated code can use
      // <Body>, <Container>, <Text>, … without importing anything. The require
      // resolver above stays for backward compatibility with older variants
      // and seed templates that still ship explicit imports.
      ...reactEmail,
    });

    try {
      vm.runInContext(compiled, context, { timeout: 3000 });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new BadRequestException(`Sandbox rejected component execution: ${msg}`);
    }

    const Cmp = module.exports.default;
    if (!Cmp || typeof Cmp !== "function") {
      throw new BadRequestException("Expected a default export React component.");
    }

    COMPILE_CACHE.set(hash, Cmp);
    return Cmp;
  }

  renderComponent(
    Component: React.ComponentType<Record<string, unknown>>,
    variables: Record<string, unknown>,
  ): string {
    let html: string;
    try {
      html = renderToStaticMarkup(React.createElement(Component, variables));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new InternalServerErrorException(`Failed to render email HTML: ${msg}`);
    }
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">${html}`;
  }

  /** Shortcut used by generation: compile once and render with preview vars. */
  compile(componentCode: string, variables: Record<string, unknown> = {}): string {
    const Component = this.compileComponent(componentCode);
    return this.renderComponent(Component, variables);
  }
}
