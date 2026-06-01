/**
 * Static AST evaluator for ESM modules whose default export is a pure data
 * literal (plus references to other top-level constants in the same file).
 *
 * **The walker never executes code.** It uses `acorn` to produce an ESTree
 * AST and then resolves a subset of expression nodes: literals, arrays,
 * objects, identifiers (looked up in a module-local symbol table), member
 * expressions, unary `-`/`!`/`+`, and template literals whose expressions
 * themselves resolve statically. Anything else throws `WalkerError`.
 *
 * This matches what `esbuild` emits for a manifest module like
 * `export default { id, version, capabilities: [...] }`: the bundler inlines
 * imported constants as top-level `var`s in the same file, so all references
 * are resolvable without crossing module boundaries.
 *
 * Security posture: there is no `eval`, no `vm`, no `require`. A malicious
 * manifest hits the "not statically analyzable" path and is rejected. The
 * walker is also depth- and node-bounded to refuse pathological inputs.
 */

import type { Node, Program } from "acorn";
import { Parser } from "acorn";

export class WalkerError extends Error {
  constructor(
    message: string,
    public readonly loc?: { line: number; column: number }
  ) {
    super(loc ? `${message} (at line ${loc.line}, column ${loc.column})` : message);
    this.name = "WalkerError";
  }
}

const MAX_DEPTH = 32;
const MAX_NODES = 50_000;

interface Ctx {
  symbols: Map<string, Node>;
  resolving: Set<string>;
  nodesVisited: { count: number };
}

/**
 * Resolver callback for tarball-local imports. Given a module specifier
 * (e.g. `"./constants.js"`), returns the JavaScript source of the imported
 * file, or `null` if not available. The extractor implements this by looking
 * up sibling files in the npm tarball we already have in memory — we never
 * fetch additional resources.
 */
export type ImportResolver = (specifier: string) => string | null;

/**
 * Parse a JavaScript source string and statically resolve its default export.
 * Returns the JSON-equivalent value of the export. Throws `WalkerError` if any
 * part of the export resolves to something other than a literal value.
 *
 * If an `importResolver` is supplied, top-level `import { X } from "./foo.js"`
 * declarations are followed: the named exports of the imported module are
 * injected into the symbol table for `X`. This lets us handle plugins built
 * with `tsc` (which preserves imports) in addition to esbuild-bundled plugins
 * (which inline everything). The resolver only loads file content; the walker
 * still never executes anything.
 */
export function extractDefaultExport(source: string, importResolver?: ImportResolver): unknown {
  const program = parseProgram(source);
  const symbols = collectTopLevelSymbols(program);
  if (importResolver) {
    collectImportedSymbols(program, symbols, importResolver);
  }
  const defaultExport = findDefaultExport(program);
  if (!defaultExport) {
    throw new WalkerError("module has no default export");
  }

  const ctx: Ctx = { symbols, resolving: new Set(), nodesVisited: { count: 0 } };
  return resolve(defaultExport, ctx, 0);
}

function parseProgram(source: string): Program {
  try {
    return Parser.parse(source, {
      ecmaVersion: "latest",
      sourceType: "module",
      allowReturnOutsideFunction: false,
      allowHashBang: false,
      locations: true,
    }) as unknown as Program;
  } catch (err) {
    throw new WalkerError(`parse failed: ${(err as Error).message}`);
  }
}

/**
 * For each `import { X, Y } from "./foo.js"` (or default import) at the top
 * of the program, fetch the imported module's source via `resolver` and
 * inject the named exports' initializers into `symbols` so the main walker
 * resolves them like local bindings.
 *
 * Limitations (intentional):
 * - Only resolves `ImportSpecifier` and `ImportDefaultSpecifier`. Namespace
 *   imports (`import * as X`) are not supported.
 * - Re-export chains (`export { X } from "./..."`) one hop deep only.
 * - Silently skips unresolved imports — the manifest may not actually
 *   reference everything it imports, and the walker will throw a clean
 *   "unresolved identifier" error if it does.
 */
function collectImportedSymbols(
  program: Program,
  symbols: Map<string, Node>,
  resolver: ImportResolver
): void {
  for (const node of program.body) {
    // biome-ignore lint/suspicious/noExplicitAny: ESTree
    const n = node as any;
    if (n.type !== "ImportDeclaration") continue;
    const specifier = n.source?.value;
    if (typeof specifier !== "string") continue;
    const importedSource = resolver(specifier);
    if (!importedSource) continue;
    let importedProgram: Program;
    try {
      importedProgram = parseProgram(importedSource);
    } catch {
      continue;
    }
    const exports = collectModuleExports(importedProgram);
    for (const spec of n.specifiers ?? []) {
      if (spec.type === "ImportSpecifier") {
        const importedName = spec.imported?.name ?? spec.imported?.value;
        const localName = spec.local?.name;
        const init = exports.get(importedName);
        if (init && localName) symbols.set(localName, init);
      } else if (spec.type === "ImportDefaultSpecifier") {
        const init = exports.get("default");
        if (init && spec.local?.name) symbols.set(spec.local.name, init);
      }
    }
  }
}

/**
 * Map exported-name → initializer node for a single module. Handles
 * `export const X = ...`, `export { X }`, and `export default ...`.
 * One-hop re-exports (`export { X } from "./other"`) are NOT followed —
 * we only look at local bindings.
 */
function collectModuleExports(program: Program): Map<string, Node> {
  const localBindings = collectTopLevelSymbols(program);
  const out = new Map<string, Node>();
  for (const node of program.body) {
    // biome-ignore lint/suspicious/noExplicitAny: ESTree
    const n = node as any;
    if (n.type === "ExportNamedDeclaration") {
      if (n.declaration?.type === "VariableDeclaration") {
        for (const decl of n.declaration.declarations) {
          if (decl.id.type === "Identifier" && decl.init) {
            out.set(decl.id.name, decl.init);
          }
        }
      }
      if (Array.isArray(n.specifiers)) {
        for (const spec of n.specifiers) {
          const exported = spec.exported?.name ?? spec.exported?.value;
          const localName = spec.local?.name;
          if (!exported || !localName) continue;
          const init = localBindings.get(localName);
          if (init) out.set(exported, init);
        }
      }
    } else if (n.type === "ExportDefaultDeclaration" && n.declaration) {
      out.set("default", n.declaration as Node);
    }
  }
  return out;
}

/**
 * Build a symbol table from top-level `var`/`let`/`const` declarators. Function
 * and class declarations are intentionally ignored — they're not allowed in
 * manifest values, and silently registering them would let computed-via-call
 * expressions slip past the "must be statically analyzable" gate.
 */
function collectTopLevelSymbols(program: Program): Map<string, Node> {
  const symbols = new Map<string, Node>();
  for (const node of program.body) {
    if (node.type !== "VariableDeclaration") continue;
    for (const decl of node.declarations) {
      if (decl.id.type !== "Identifier") continue;
      if (!decl.init) continue;
      symbols.set(decl.id.name, decl.init);
    }
  }
  return symbols;
}

/**
 * Find the expression node that represents the default export. Handles both
 * `export default expr` and `export { localName as default }` (esbuild's
 * preferred shape).
 */
function findDefaultExport(program: Program): Node | null {
  for (const node of program.body) {
    // biome-ignore lint/suspicious/noExplicitAny: ESTree nodes from acorn
    const n = node as any;
    if (n.type === "ExportDefaultDeclaration") {
      return n.declaration as Node;
    }
    if (n.type === "ExportNamedDeclaration" && Array.isArray(n.specifiers)) {
      for (const spec of n.specifiers) {
        const exported = spec.exported?.name ?? spec.exported?.value;
        if (exported === "default" && spec.local?.type === "Identifier") {
          return spec.local;
        }
      }
    }
  }
  return null;
}

function resolve(node: Node, ctx: Ctx, depth: number): unknown {
  if (depth > MAX_DEPTH) {
    throw new WalkerError("maximum nesting depth exceeded", locOf(node));
  }
  ctx.nodesVisited.count += 1;
  if (ctx.nodesVisited.count > MAX_NODES) {
    throw new WalkerError("too many AST nodes visited (parser bomb?)", locOf(node));
  }

  // biome-ignore lint/suspicious/noExplicitAny: walking heterogeneous ESTree nodes
  const n = node as any;
  switch (n.type) {
    case "Literal":
      return n.value;
    case "TemplateLiteral":
      return resolveTemplate(n, ctx, depth);
    case "UnaryExpression":
      return resolveUnary(n, ctx, depth);
    case "ArrayExpression":
      return n.elements.map((el: Node | null) => {
        if (el === null) {
          throw new WalkerError("sparse arrays not supported", locOf(node));
        }
        if (el.type === "SpreadElement") {
          throw new WalkerError("spread in arrays not supported", locOf(el));
        }
        return resolve(el, ctx, depth + 1);
      });
    case "ObjectExpression":
      return resolveObject(n, ctx, depth);
    case "Identifier":
      return resolveIdentifier(n.name, n, ctx, depth);
    case "MemberExpression":
      return resolveMember(n, ctx, depth);
    case "ChainExpression":
      // Optional chaining (`a?.b?.c`): unwrap to the underlying member/call
      // chain and resolve. Member access on null/undefined short-circuits
      // to `undefined`, matching JS semantics.
      return resolveChain(n.expression as Node, ctx, depth + 1);
    case "LogicalExpression":
      return resolveLogical(n, ctx, depth);
    case "ConditionalExpression":
      return resolveConditional(n, ctx, depth);
    case "TaggedTemplateExpression":
    case "CallExpression":
    case "NewExpression":
    case "ArrowFunctionExpression":
    case "FunctionExpression":
    case "BinaryExpression":
      throw new WalkerError(
        `expression of type ${n.type} is not statically analyzable; manifests must be pure data literals`,
        locOf(node)
      );
    default:
      throw new WalkerError(
        `expression of type ${n.type} is not statically analyzable`,
        locOf(node)
      );
  }
}

function resolveTemplate(
  n: { quasis: { value: { cooked: string } }[]; expressions: Node[] },
  ctx: Ctx,
  depth: number
): string {
  const head = n.quasis[0];
  if (!head) throw new WalkerError("template literal has no quasis");
  const parts: string[] = [head.value.cooked];
  for (let i = 0; i < n.expressions.length; i += 1) {
    const expr = n.expressions[i];
    const tail = n.quasis[i + 1];
    if (!expr || !tail) throw new WalkerError("malformed template literal");
    const value = resolve(expr, ctx, depth + 1);
    if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
      throw new WalkerError(
        `template literal expression resolved to ${typeof value}; only string/number/boolean allowed`
      );
    }
    parts.push(String(value));
    parts.push(tail.value.cooked);
  }
  return parts.join("");
}

/**
 * Resolve `a || b`, `a && b`, `a ?? b`. JavaScript's short-circuit semantics
 * are deterministic over already-resolved literals, so this stays safe.
 */
function resolveLogical(
  n: { operator: string; left: Node; right: Node },
  ctx: Ctx,
  depth: number
): unknown {
  const left = resolve(n.left, ctx, depth + 1);
  switch (n.operator) {
    case "||":
      return left || resolve(n.right, ctx, depth + 1);
    case "&&":
      return left && resolve(n.right, ctx, depth + 1);
    case "??":
      return left ?? resolve(n.right, ctx, depth + 1);
    default:
      throw new WalkerError(`logical operator ${n.operator} not supported`);
  }
}

/**
 * Resolve `test ? consequent : alternate` over already-resolved literals.
 */
function resolveConditional(
  n: { test: Node; consequent: Node; alternate: Node },
  ctx: Ctx,
  depth: number
): unknown {
  return resolve(n.test, ctx, depth + 1)
    ? resolve(n.consequent, ctx, depth + 1)
    : resolve(n.alternate, ctx, depth + 1);
}

function resolveUnary(
  n: { operator: string; prefix: boolean; argument: Node },
  ctx: Ctx,
  depth: number
): unknown {
  if (!n.prefix) throw new WalkerError(`postfix unary operator ${n.operator} not supported`);
  const arg = resolve(n.argument, ctx, depth + 1);
  switch (n.operator) {
    case "-":
      if (typeof arg !== "number") throw new WalkerError(`unary - applied to ${typeof arg}`);
      return -arg;
    case "+":
      if (typeof arg !== "number") throw new WalkerError(`unary + applied to ${typeof arg}`);
      return +arg;
    case "!":
      return !arg;
    case "void":
      return undefined;
    default:
      throw new WalkerError(`unary operator ${n.operator} not supported`);
  }
}

function resolveObject(
  n: {
    properties: Array<{
      type: string;
      key: Node;
      value: Node;
      computed: boolean;
      shorthand: boolean;
    }>;
  },
  ctx: Ctx,
  depth: number
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const prop of n.properties) {
    if (prop.type !== "Property") {
      throw new WalkerError(
        `object property of type ${prop.type} not supported (no spread or methods)`
      );
    }
    const key = resolveKey(prop.key, prop.computed, ctx, depth);
    out[key] = resolve(prop.value, ctx, depth + 1);
  }
  return out;
}

function resolveKey(keyNode: Node, computed: boolean, ctx: Ctx, depth: number): string {
  // biome-ignore lint/suspicious/noExplicitAny: ESTree
  const k = keyNode as any;
  if (!computed && k.type === "Identifier") return k.name;
  if (k.type === "Literal") {
    if (typeof k.value === "string" || typeof k.value === "number") return String(k.value);
    throw new WalkerError(`object key literal must be string or number, got ${typeof k.value}`);
  }
  if (computed) {
    const value = resolve(keyNode, ctx, depth + 1);
    if (typeof value !== "string" && typeof value !== "number") {
      throw new WalkerError(`computed object key resolved to ${typeof value}`);
    }
    return String(value);
  }
  throw new WalkerError(`object key of type ${k.type} not supported`);
}

function resolveIdentifier(name: string, node: Node, ctx: Ctx, depth: number): unknown {
  if (name === "undefined") return undefined;
  if (ctx.resolving.has(name)) {
    throw new WalkerError(`circular reference detected at identifier "${name}"`, locOf(node));
  }
  const value = ctx.symbols.get(name);
  if (!value) {
    throw new WalkerError(
      `unresolved identifier "${name}" — must reference a top-level var/const/let declaration in the same module`,
      locOf(node)
    );
  }
  ctx.resolving.add(name);
  try {
    return resolve(value, ctx, depth + 1);
  } finally {
    ctx.resolving.delete(name);
  }
}

function resolveChain(node: Node, ctx: Ctx, depth: number): unknown {
  // biome-ignore lint/suspicious/noExplicitAny: ESTree
  const n = node as any;
  if (n.type === "MemberExpression") {
    const obj = resolveChain(n.object, ctx, depth + 1);
    if (obj === null || obj === undefined) return undefined;
    return resolveMemberWithObject(obj, n, ctx, depth);
  }
  if (n.type === "CallExpression") {
    throw new WalkerError("calls within optional chains are not statically analyzable");
  }
  return resolve(node, ctx, depth);
}

function resolveMember(
  n: { object: Node; property: Node; computed: boolean },
  ctx: Ctx,
  depth: number
): unknown {
  const obj = resolve(n.object, ctx, depth + 1);
  return resolveMemberWithObject(obj, n, ctx, depth);
}

function resolveMemberWithObject(
  obj: unknown,
  n: { object: Node; property: Node; computed: boolean },
  ctx: Ctx,
  depth: number
): unknown {
  if (obj === null || obj === undefined) {
    throw new WalkerError(`member access on ${obj === null ? "null" : "undefined"}`);
  }
  if (typeof obj !== "object" && typeof obj !== "string") {
    throw new WalkerError(`member access on non-object value (got ${typeof obj})`);
  }
  let key: string | number;
  // biome-ignore lint/suspicious/noExplicitAny: ESTree
  const p = n.property as any;
  if (!n.computed && p.type === "Identifier") {
    key = p.name;
  } else if (p.type === "Literal" && (typeof p.value === "string" || typeof p.value === "number")) {
    key = p.value;
  } else if (n.computed) {
    const resolved = resolve(n.property, ctx, depth + 1);
    if (typeof resolved !== "string" && typeof resolved !== "number") {
      throw new WalkerError(`member key resolved to ${typeof resolved}`);
    }
    key = resolved;
  } else {
    throw new WalkerError(`member key of type ${p.type} not supported`);
  }
  return (obj as Record<string | number, unknown>)[key];
}

function locOf(node: Node): { line: number; column: number } | undefined {
  const loc = (node as { loc?: { start?: { line: number; column: number } } }).loc;
  if (!loc?.start) return undefined;
  return { line: loc.start.line, column: loc.start.column };
}
