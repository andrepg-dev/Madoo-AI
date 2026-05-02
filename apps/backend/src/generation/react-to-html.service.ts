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

/** Deny obvious escape hatches before Babel + VM (runtime VM still has timeout). */
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
];

const COMPILE_CACHE = new Map<string, React.ComponentType<Record<string, unknown>>>();

function assertSafeSource(componentCode: string): void {
  for (const re of BLOCKLIST) {
    if (re.test(componentCode)) {
      throw new BadRequestException("Blocked pattern in generated component code.");
    }
  }
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
    const sandboxRequire = (id: string) => {
      if (id === "react") return React;
      if (id === "@react-email/components") {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require("@react-email/components") as Record<string, unknown>;
      }
      throw new Error(`Module not allowed: ${id}`);
    };

    const context = vm.createContext({
      module,
      exports: module.exports,
      React,
      require: sandboxRequire,
      console: { error: console.error, warn: console.warn },
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
