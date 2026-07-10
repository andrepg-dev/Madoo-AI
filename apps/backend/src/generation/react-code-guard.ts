import { BadRequestException } from "@nestjs/common";
import { parse, traverse, types as t } from "@babel/core";

/**
 * Security guard for model-generated email component source.
 *
 * `node:vm` is NOT a security boundary: any object reachable from the sandbox
 * (React, the injected email components, even a no-op console) exposes the outer
 * realm through `.constructor`, so `x.constructor.constructor("return process")()`
 * is a full escape. Regex blocklists on the raw text are trivially defeated with
 * bracket notation / string concatenation. The real defense is a positive AST
 * allowlist: forbid every language construct that can reach a constructor,
 * prototype, or dangerous free identifier, so no escape gadget can be expressed.
 */

/** Modules the generated source is allowed to `import` from. */
const ALLOWED_IMPORTS = new Set(["react", "@react-email/components"]);

/**
 * Free identifiers that must never be referenced. Anything that resolves to a
 * global binding (no local declaration in scope) is checked against this set.
 */
const DENIED_GLOBALS = new Set([
  "process",
  "require",
  "module",
  "exports",
  "global",
  "globalThis",
  "eval",
  "Function",
  "WebAssembly",
  "Reflect",
  "Proxy",
  "Buffer",
  "Atomics",
  "SharedArrayBuffer",
  "fetch",
  "XMLHttpRequest",
  "import",
  "__dirname",
  "__filename",
  "setTimeout",
  "setInterval",
  "setImmediate",
  "queueMicrotask",
  "constructor",
]);

/** Property names that expose the prototype chain / constructor gadget. */
const DENIED_PROPERTIES = new Set([
  "constructor",
  "__proto__",
  "prototype",
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__",
  // Raw-HTML injection: the visual editor renders previews in a same-origin
  // iframe, so generated markup must never carry arbitrary script-capable HTML.
  "dangerouslySetInnerHTML",
]);

function reject(reason: string): never {
  throw new BadRequestException(`Blocked pattern in generated component code: ${reason}`);
}

function propertyName(node: t.Node): string | undefined {
  if (node.type === "Identifier") return node.name;
  if (node.type === "StringLiteral") return node.value;
  return undefined;
}

/**
 * Parse the TSX source and reject any construct that could reach the outer
 * realm. Throws {@link BadRequestException} on the first violation.
 */
export function assertSafeComponentSource(code: string): void {
  let ast;
  try {
    ast = parse(code, {
      filename: "generated-email.tsx",
      presets: [["@babel/preset-typescript", { isTSX: true, allExtensions: true }]],
      babelrc: false,
      configFile: false,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new BadRequestException(`Failed to parse email component: ${msg}`);
  }
  if (!ast) reject("empty parse result");

  traverse(ast, {
    ImportDeclaration(path) {
      if (!ALLOWED_IMPORTS.has(path.node.source.value)) {
        reject(`import from "${path.node.source.value}" is not allowed`);
      }
    },
    // `export { x } from 'mod'` / `export * from 'mod'` also load `mod` (a
    // `require` after transpile), so their source must be allowlisted too.
    ExportNamedDeclaration(path) {
      const source = path.node.source?.value;
      if (source && !ALLOWED_IMPORTS.has(source)) {
        reject(`re-export from "${source}" is not allowed`);
      }
    },
    ExportAllDeclaration(path) {
      if (!ALLOWED_IMPORTS.has(path.node.source.value)) {
        reject(`re-export from "${path.node.source.value}" is not allowed`);
      }
    },
    // Dynamic `import(...)` and CommonJS `require(...)` are both escape vectors.
    Import() {
      reject("dynamic import() is not allowed");
    },
    CallExpression(path) {
      const callee = path.node.callee;
      if (callee.type === "Identifier" && callee.name === "require") {
        reject("require() is not allowed");
      }
    },
    MemberExpression(path) {
      const { property, computed } = path.node;
      if (computed) {
        // `obj[expr]` — only allow static string/number keys so `obj["cons"+"tructor"]`
        // and `obj[k]` (with k a runtime string) cannot reach denied properties.
        if (property.type !== "StringLiteral" && property.type !== "NumericLiteral") {
          reject("computed member access with a non-literal key is not allowed");
        }
      }
      const name = propertyName(property);
      if (name && DENIED_PROPERTIES.has(name)) {
        reject(`access to "${name}" is not allowed`);
      }
    },
    // JSX form of raw-HTML injection: <div dangerouslySetInnerHTML={…} />.
    JSXAttribute(path) {
      const name = path.node.name;
      if (name.type === "JSXIdentifier" && name.name === "dangerouslySetInnerHTML") {
        reject("dangerouslySetInnerHTML is not allowed");
      }
    },
    // Block destructuring an escape gadget out of an object: `const { constructor: c } = x`.
    ObjectProperty(path) {
      const name = propertyName(path.node.key);
      if (name && DENIED_PROPERTIES.has(name)) {
        reject(`destructuring "${name}" is not allowed`);
      }
    },
    Identifier(path) {
      const name = path.node.name;
      if (!DENIED_GLOBALS.has(name)) return;
      // Only flag references that are *not* locally declared. `getBinding`
      // returns a binding only for real declarations (not ambient globals like
      // `globalThis`), so an undefined result means a free/global reference.
      if (!path.isReferencedIdentifier()) return;
      if (path.scope.getBinding(name)) return;
      reject(`reference to "${name}" is not allowed`);
    },
  });
}
