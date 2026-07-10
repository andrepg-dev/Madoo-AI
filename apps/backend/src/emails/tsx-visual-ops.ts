import { BadRequestException } from "@nestjs/common";
import * as recast from "recast";
import * as babelTsParser from "recast/parsers/babel-ts";
import {
  VISUAL_EDIT_DYNAMIC_ATTR,
  VISUAL_EDIT_ID_ATTR,
  VISUAL_EDIT_TEXT_ATTR,
  type VisualEditOp,
} from "@madoo/shared";

/**
 * Pure AST helpers behind the visual editor. The stored TSX componentCode is
 * the single source of truth: `tagComponentSource` stamps every selectable
 * JSX element with its `line:column` position so the compiled preview HTML
 * can be mapped back to the exact AST node, and `applyVisualOps` patches
 * those nodes and reprints the source with recast (format-preserving).
 *
 * Node ids are positions in the *stored* code, so both passes must parse the
 * exact same string. After an op the code is reprinted and every id changes —
 * clients must refetch the tagged HTML for the new variant before editing on.
 */

const b = recast.types.builders;
const n = recast.types.namedTypes;

type AstPath = InstanceType<typeof recast.types.NodePath>;

/** Structural / non-visual elements that get no id (not selectable). */
const SKIP_TAG_NAMES = new Set([
  "Html",
  "Head",
  "Preview",
  "Font",
  "Tailwind",
  "style",
  "title",
  "meta",
  "link",
  "script",
]);

/** Deleting or moving these would produce a broken document. */
const PROTECTED_STRUCTURE_NAMES = new Set(["Html", "Head", "Body", "Preview"]);

const FUNCTION_TYPES = new Set([
  "ArrowFunctionExpression",
  "FunctionExpression",
  "FunctionDeclaration",
  "ObjectMethod",
  "ClassMethod",
]);

const CONDITIONAL_TYPES = new Set([
  "ConditionalExpression",
  "LogicalExpression",
]);

export function parseComponentAst(code: string): recast.types.ASTNode {
  try {
    return recast.parse(code, { parser: babelTsParser }) as recast.types.ASTNode;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new BadRequestException(`Could not parse email component: ${msg}`);
  }
}

function jsxElementName(node: unknown): string | null {
  if (!n.JSXElement.check(node)) return null;
  const name = node.openingElement.name;
  return n.JSXIdentifier.check(name) ? name.name : null;
}

function nodeIdOf(node: { loc?: { start: { line: number; column: number } } | null }): string | null {
  const start = node.loc?.start;
  return start ? `${start.line}:${start.column}` : null;
}

/**
 * An element is "dynamic" when it renders more than once or conditionally:
 * anything nested under a second function (`.map` callback) or under a
 * ternary/logical expression. Those nodes cannot be manipulated 1:1 — one
 * AST node produces N DOM nodes — so direct ops are refused and the client
 * falls back to AI edits.
 */
function isDynamicJsxPath(path: AstPath): boolean {
  let functionCount = 0;
  for (let p = path.parent; p; p = p.parent) {
    const type = (p.node as { type?: string }).type;
    if (!type) continue;
    if (CONDITIONAL_TYPES.has(type)) return true;
    if (FUNCTION_TYPES.has(type)) {
      functionCount += 1;
      if (functionCount >= 2) return true;
    }
  }
  return false;
}

/**
 * Map of prop name → AssignmentPattern whose default is a plain string, taken
 * from the first destructured parameter of every function in the file. These
 * are the props the variables system edits (`{headline}` bound to a default).
 */
function collectPropDefaults(
  ast: recast.types.ASTNode,
): Map<string, recast.types.namedTypes.AssignmentPattern> {
  const defaults = new Map<string, recast.types.namedTypes.AssignmentPattern>();

  const collectFromParam = (param: unknown) => {
    // Both `({ a = 'x' })` and `({ a = 'x' } = {})` shapes.
    const pattern = n.AssignmentPattern.check(param) ? param.left : param;
    if (!n.ObjectPattern.check(pattern)) return;
    for (const prop of pattern.properties) {
      if (!n.ObjectProperty.check(prop) && !n.Property.check(prop)) continue;
      const key = (prop as recast.types.namedTypes.ObjectProperty).key;
      const value = (prop as recast.types.namedTypes.ObjectProperty).value;
      if (!n.Identifier.check(key)) continue;
      if (!n.AssignmentPattern.check(value)) continue;
      if (!n.StringLiteral.check(value.right)) continue;
      defaults.set(key.name, value);
    }
  };

  recast.types.visit(ast, {
    visitFunction(path) {
      const params = (path.node as { params?: unknown[] }).params;
      if (params && params.length > 0) collectFromParam(params[0]);
      this.traverse(path);
    },
  });

  return defaults;
}

type TextBinding =
  | { kind: "literal" }
  | { kind: "var"; name: string };

/**
 * Detects whether an element's content is a single directly-editable text:
 * one JSXText child (literal) or one `{propName}` expression whose prop has
 * a string default (var). Mixed content is not inline-editable.
 */
function textBindingOf(
  element: recast.types.namedTypes.JSXElement,
  propDefaults: Map<string, recast.types.namedTypes.AssignmentPattern>,
): TextBinding | null {
  const significant = (element.children ?? []).filter((child) => {
    if (n.JSXText.check(child)) return child.value.trim() !== "";
    return true;
  });
  if (significant.length !== 1) return null;
  const only = significant[0];
  if (n.JSXText.check(only)) return { kind: "literal" };
  if (
    n.JSXExpressionContainer.check(only) &&
    n.Identifier.check(only.expression) &&
    propDefaults.has(only.expression.name)
  ) {
    return { kind: "var", name: only.expression.name };
  }
  return null;
}

function hasAttribute(
  element: recast.types.namedTypes.JSXElement,
  name: string,
): boolean {
  return element.openingElement.attributes?.some(
    (attr) =>
      n.JSXAttribute.check(attr) &&
      n.JSXIdentifier.check(attr.name) &&
      attr.name.name === name,
  ) ?? false;
}

function pushAttribute(
  element: recast.types.namedTypes.JSXElement,
  name: string,
  value: string,
): void {
  const attr = b.jsxAttribute(b.jsxIdentifier(name), b.stringLiteral(value));
  element.openingElement.attributes = [
    ...(element.openingElement.attributes ?? []),
    attr,
  ];
}

/**
 * Returns the component source with visual-editor attributes injected:
 * `data-m-id="line:column"` on every selectable element, plus
 * `data-m-text` / `data-m-dynamic` capability flags. The result is compiled
 * for the editor preview only — never stored, sent, or exported.
 */
export function tagComponentSource(code: string): string {
  const ast = parseComponentAst(code);
  const propDefaults = collectPropDefaults(ast);

  recast.types.visit(ast, {
    visitJSXElement(path) {
      const element = path.node;
      const name = jsxElementName(element);
      const id = nodeIdOf(element);
      if (!name || !id || SKIP_TAG_NAMES.has(name) || hasAttribute(element, VISUAL_EDIT_ID_ATTR)) {
        this.traverse(path);
        return;
      }

      pushAttribute(element, VISUAL_EDIT_ID_ATTR, id);

      const dynamic = isDynamicJsxPath(path);
      if (dynamic) {
        pushAttribute(element, VISUAL_EDIT_DYNAMIC_ATTR, "1");
      } else {
        const binding = textBindingOf(element, propDefaults);
        if (binding) {
          pushAttribute(
            element,
            VISUAL_EDIT_TEXT_ATTR,
            binding.kind === "literal" ? "literal" : `var:${binding.name}`,
          );
        }
      }

      this.traverse(path);
    },
  });

  return recast.print(ast).code;
}

export interface VisualOpsResult {
  code: string;
  /** Prop defaults changed by setText on `{prop}`-bound elements, so the
   *  caller can mirror them into the variant's variableSchema. */
  variableUpdates: { name: string; value: string }[];
  /** Human-readable description per applied op, e.g. `Deleted <Button>`. */
  summaries: string[];
}

function findElementPaths(
  ast: recast.types.ASTNode,
): Map<string, AstPath> {
  const byId = new Map<string, AstPath>();
  recast.types.visit(ast, {
    visitJSXElement(path) {
      const id = nodeIdOf(path.node);
      if (id && !byId.has(id)) byId.set(id, path as AstPath);
      this.traverse(path);
    },
  });
  return byId;
}

/** True when the text can live in a raw JSXText node without changing meaning. */
function isPlainJsxText(text: string): boolean {
  return !/[{}<>]/.test(text) && text.trim() !== "";
}

/**
 * A sibling counts as visual content for reordering: another element, or an
 * expression block like `{items.map(...)}` / `{flag && <X />}` that renders
 * something. Whitespace JSXText between them is skipped (and left in place —
 * recast reprints the swapped nodes with their surrounding formatting).
 */
function isMovableSibling(node: unknown): boolean {
  if (n.JSXElement.check(node)) return true;
  return (
    n.JSXExpressionContainer.check(node) &&
    !n.JSXEmptyExpression.check(node.expression)
  );
}

/** Swaps the element with its previous/next sibling in the parent's children. */
function moveAmongSiblings(
  path: AstPath,
  element: recast.types.namedTypes.JSXElement,
  direction: "up" | "down",
  name: string,
): void {
  const parentNode = path.parent?.node as { children?: unknown[] } | undefined;
  const children = parentNode?.children;
  if (!Array.isArray(children)) {
    throw new BadRequestException(`<${name}> cannot be moved.`);
  }
  const index = children.indexOf(element);
  if (index === -1) {
    throw new BadRequestException(`<${name}> cannot be moved.`);
  }
  const step = direction === "up" ? -1 : 1;
  let target = index + step;
  while (target >= 0 && target < children.length && !isMovableSibling(children[target])) {
    target += step;
  }
  if (target < 0 || target >= children.length) {
    throw new BadRequestException(
      direction === "up"
        ? `<${name}> is already at the top of its section.`
        : `<${name}> is already at the bottom of its section.`,
    );
  }
  [children[index], children[target]] = [children[target], children[index]];
}

/**
 * Applies visual ops to the stored component source and reprints it.
 * Every op re-validates server-side (dynamic nodes, protected elements),
 * so a stale or forged client payload cannot corrupt the document.
 */
export function applyVisualOps(
  code: string,
  ops: readonly VisualEditOp[],
): VisualOpsResult {
  const ast = parseComponentAst(code);
  const propDefaults = collectPropDefaults(ast);
  const byId = findElementPaths(ast);
  const variableUpdates: { name: string; value: string }[] = [];
  const summaries: string[] = [];

  for (const op of ops) {
    const path = byId.get(op.nodeId);
    if (!path) {
      throw new BadRequestException(
        "This element no longer exists in the current version — refresh the preview and try again.",
      );
    }
    const element = path.node as recast.types.namedTypes.JSXElement;
    const name = jsxElementName(element) ?? "element";

    if (isDynamicJsxPath(path)) {
      throw new BadRequestException(
        `<${name}> is rendered dynamically — ask the AI to change it instead.`,
      );
    }

    if (op.op === "delete") {
      if (PROTECTED_STRUCTURE_NAMES.has(name)) {
        throw new BadRequestException(`<${name}> cannot be deleted.`);
      }
      path.prune();
      byId.delete(op.nodeId);
      summaries.push(`Deleted <${name}>`);
      continue;
    }

    if (op.op === "move") {
      if (PROTECTED_STRUCTURE_NAMES.has(name)) {
        throw new BadRequestException(`<${name}> cannot be moved.`);
      }
      moveAmongSiblings(path, element, op.direction, name);
      summaries.push(`Moved <${name}> ${op.direction}`);
      continue;
    }

    // setText
    const binding = textBindingOf(element, propDefaults);
    if (!binding) {
      throw new BadRequestException(
        `The text of <${name}> is not directly editable — ask the AI to change it instead.`,
      );
    }
    if (binding.kind === "var") {
      const pattern = propDefaults.get(binding.name);
      if (!pattern || !n.StringLiteral.check(pattern.right)) {
        throw new BadRequestException(
          `The default of "${binding.name}" is not a plain string.`,
        );
      }
      pattern.right = b.stringLiteral(op.text);
      variableUpdates.push({ name: binding.name, value: op.text });
    } else {
      element.children = [
        isPlainJsxText(op.text)
          ? b.jsxText(op.text)
          : b.jsxExpressionContainer(b.stringLiteral(op.text)),
      ];
    }
    summaries.push(`Edited text in <${name}>`);
  }

  return { code: recast.print(ast).code, variableUpdates, summaries };
}

export interface SelectedElementSnippet {
  name: string;
  snippet: string;
}

const SNIPPET_MAX_CHARS = 1500;

/** Prints the selected element's TSX so the AI edit prompt can pin it. */
export function extractElementSnippet(
  code: string,
  nodeId: string,
): SelectedElementSnippet | null {
  const ast = parseComponentAst(code);
  const path = findElementPaths(ast).get(nodeId);
  if (!path) return null;
  const element = path.node as recast.types.namedTypes.JSXElement;
  const name = jsxElementName(element) ?? "element";
  let snippet = recast.print(element).code;
  if (snippet.length > SNIPPET_MAX_CHARS) {
    snippet = `${snippet.slice(0, SNIPPET_MAX_CHARS)}\n… (truncated)`;
  }
  return { name, snippet };
}
