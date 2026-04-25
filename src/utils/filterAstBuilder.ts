import type {
  FilterAstNode,
  FilterLogicalOperator,
  ProductAttribute,
} from '../types/product.js';
import { isValidAttribute, parseExpressionToAst } from './filterQlParser.js';

export type AttributeSelectionMap = Partial<Record<ProductAttribute, string[]>>;

export function selectionMapToAst(selections: AttributeSelectionMap): FilterAstNode | null {
  const normalizedEntries = Object.entries(selections)
    .filter(([key, values]) => isValidAttribute(key) && Array.isArray(values) && values.length > 0)
    .map(([key, values]) => ({
      attribute: key as ProductAttribute,
      values: values as string[],
    }));

  let root: FilterAstNode | null = null;

  for (const entry of normalizedEntries) {
    let attributeNode: FilterAstNode | null = null;
    for (const value of entry.values) {
      const comparison: FilterAstNode = {
        type: 'comparison',
        attribute: entry.attribute,
        operator: '=',
        value,
      };
      attributeNode = attributeNode
        ? { type: 'logical', operator: 'OR', left: attributeNode, right: comparison }
        : comparison;
    }

    if (!attributeNode) continue;
    root = root
      ? { type: 'logical', operator: 'AND', left: root, right: attributeNode }
      : attributeNode;
  }

  return root;
}

function comparisonToCompactExpression(ast: FilterAstNode & { type: 'comparison' }): string {
  return `${ast.attribute}${ast.operator}${JSON.stringify(ast.value)}`;
}

/**
 * Serialize logical nodes without redundant parens for same-operator chains
 * (e.g. `a OR b OR c` instead of `((a OR b) OR c)`).
 */
function emitLogicalCompact(ast: FilterAstNode & { type: 'logical' }): string {
  return `${emitLogicalChildCompact(ast.left, ast.operator)} ${ast.operator} ${emitLogicalChildCompact(ast.right, ast.operator)}`;
}

function emitLogicalChildCompact(child: FilterAstNode, parentOp: FilterLogicalOperator): string {
  if (child.type === 'comparison') {
    return comparisonToCompactExpression(child);
  }
  if (child.operator === parentOp) {
    return emitLogicalCompact(child);
  }
  return `(${emitLogicalCompact(child)})`;
}

export function astToExpression(ast: FilterAstNode | null): string {
  if (!ast) return '';
  if (ast.type === 'comparison') {
    return comparisonToCompactExpression(ast);
  }
  return emitLogicalCompact(ast);
}

function escapeSingleQuotedLiteral(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function emitComparisonReadable(ast: FilterAstNode & { type: 'comparison' }): string {
  return `${ast.attribute} ${ast.operator} '${escapeSingleQuotedLiteral(ast.value)}'`;
}

function emitLogicalReadable(ast: FilterAstNode & { type: 'logical' }): string {
  return `${emitLogicalChild(ast.left, ast.operator)} ${ast.operator} ${emitLogicalChild(ast.right, ast.operator)}`;
}

function emitLogicalChild(child: FilterAstNode, parentOp: FilterLogicalOperator): string {
  if (child.type === 'comparison') {
    return emitComparisonReadable(child);
  }
  if (child.operator === parentOp) {
    return emitLogicalReadable(child);
  }
  return `(${emitLogicalReadable(child)})`;
}

/**
 * Pretty FilterQL for docs/API samples: spaced operators and single-quoted literals
 * (avoids JSON-style `\"` noise when embedded in JSON bodies).
 */
export function filterAstToReadableQl(ast: FilterAstNode | null): string {
  if (!ast) return '';
  if (ast.type === 'comparison') {
    return emitComparisonReadable(ast);
  }
  return emitLogicalReadable(ast);
}

/**
 * Parse if possible and return readable QL; otherwise return the original string trimmed.
 */
export function filterExpressionToReadableQl(expression: string): string {
  const trimmed = expression.trim();
  if (!trimmed) return '';
  const { ast } = parseExpressionToAst(trimmed);
  if (!ast) return trimmed;
  return filterAstToReadableQl(ast);
}

/**
 * Body field `filterExpression` for POST /product/search: prefer the stored FilterQL string;
 * if missing, serialize AST to readable FilterQL. Omits when there is no filter.
 */
export function toProductSearchFilterExpression(
  filterAst: FilterAstNode | null,
  filterExpression: string | null | undefined
): string | undefined {
  const trimmed = filterExpression?.trim();
  if (trimmed) return trimmed;
  if (filterAst) return filterAstToReadableQl(filterAst);
  return undefined;
}

export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

export function hasComparisonClause(
  ast: FilterAstNode | null,
  attribute: ProductAttribute,
  value: string
): boolean {
  if (!ast) return false;
  if (ast.type === 'comparison') {
    return ast.attribute === attribute && ast.operator === '=' && equalsIgnoreCase(ast.value, value);
  }
  return hasComparisonClause(ast.left, attribute, value) || hasComparisonClause(ast.right, attribute, value);
}

type ConjunctClass = 'onlyAttr' | 'other' | 'mixed';

function collectComparisonLeaves(ast: FilterAstNode): Extract<FilterAstNode, { type: 'comparison' }>[] {
  if (ast.type === 'comparison') {
    return [ast];
  }
  return [...collectComparisonLeaves(ast.left), ...collectComparisonLeaves(ast.right)];
}

function classifyConjunct(ast: FilterAstNode, attribute: ProductAttribute): ConjunctClass {
  const leaves = collectComparisonLeaves(ast);
  if (leaves.length === 0) return 'other';
  let sawAttr = false;
  let sawOther = false;
  for (const leaf of leaves) {
    if (leaf.attribute === attribute) {
      if (leaf.operator !== '=') return 'mixed';
      sawAttr = true;
    } else {
      sawOther = true;
    }
  }
  if (sawAttr && sawOther) return 'mixed';
  if (sawAttr) return 'onlyAttr';
  return 'other';
}

/** Flatten a tree of ANDs into top-level conjuncts; OR or single node stays one conjunct. */
export function flattenAndConjuncts(ast: FilterAstNode): FilterAstNode[] {
  if (ast.type === 'comparison') return [ast];
  if (ast.operator === 'AND') {
    return [...flattenAndConjuncts(ast.left), ...flattenAndConjuncts(ast.right)];
  }
  return [ast];
}

function combineWithAnd(nodes: FilterAstNode[]): FilterAstNode {
  if (nodes.length === 0) {
    throw new Error('combineWithAnd requires at least one node');
  }
  if (nodes.length === 1) return nodes[0]!;
  let acc = nodes[0]!;
  for (let i = 1; i < nodes.length; i++) {
    acc = { type: 'logical', operator: 'AND', left: acc, right: nodes[i]! };
  }
  return acc;
}

function areIndicesContiguous(indices: number[]): boolean {
  if (indices.length <= 1) return true;
  for (let i = 1; i < indices.length; i++) {
    if (indices[i]! !== indices[i - 1]! + 1) return false;
  }
  return true;
}

export type AddComparisonClauseResult =
  | { ast: FilterAstNode; error: null }
  | { ast: null; error: string };

/**
 * Add a comparison for an attribute by OR-ing with the existing subtree for that attribute
 * (same-attribute values are alternatives). Different attributes remain AND-ed at the top level.
 * Legacy shapes like (category = A AND category = B) OR category = C when adding a third category.
 * Returns an error for mixed-attribute conjuncts, non-contiguous attribute clauses, or non-= ops on the attribute.
 */
export function addComparisonClause(
  ast: FilterAstNode | null,
  attribute: ProductAttribute,
  value: string
): AddComparisonClauseResult {
  const clause: FilterAstNode = { type: 'comparison', attribute, operator: '=', value };
  if (!ast) {
    return { ast: clause, error: null };
  }

  const conjuncts = flattenAndConjuncts(ast);
  const classes = conjuncts.map((c) => classifyConjunct(c, attribute));
  if (classes.some((c) => c === 'mixed')) {
    return {
      ast: null,
      error: `Cannot add ${attribute}: filter mixes this attribute with others inside a sub-expression`,
    };
  }

  const attrIndices = classes
    .map((c, i) => (c === 'onlyAttr' ? i : -1))
    .filter((i) => i >= 0);
  if (attrIndices.length > 0 && !areIndicesContiguous(attrIndices)) {
    return {
      ast: null,
      error: `Cannot add ${attribute}: clauses for this attribute are not contiguous; simplify the filter first`,
    };
  }

  const attrConjuncts = conjuncts.filter((_, i) => classes[i] === 'onlyAttr');

  const attrCombined =
    attrConjuncts.length === 0 ? null : attrConjuncts.length === 1 ? attrConjuncts[0] : combineWithAnd(attrConjuncts);

  const mergedForAttr = attrCombined
    ? { type: 'logical' as const, operator: 'OR' as const, left: attrCombined, right: clause }
    : clause;

  if (attrConjuncts.length === 0) {
    const rest = conjuncts.filter((_, i) => classes[i] === 'other');
    return { ast: combineWithAnd([...rest, mergedForAttr]), error: null };
  }

  const newConjuncts: FilterAstNode[] = [];
  let i = 0;
  while (i < conjuncts.length) {
    if (classes[i] === 'onlyAttr') {
      newConjuncts.push(mergedForAttr);
      while (i < conjuncts.length && classes[i] === 'onlyAttr') i++;
    } else {
      newConjuncts.push(conjuncts[i]!);
      i++;
    }
  }

  return { ast: combineWithAnd(newConjuncts), error: null };
}

export function pruneAst(
  ast: FilterAstNode | null,
  shouldRemove: (node: Extract<FilterAstNode, { type: 'comparison' }>) => boolean
): FilterAstNode | null {
  if (!ast) return null;
  if (ast.type === 'comparison') {
    return shouldRemove(ast) ? null : ast;
  }

  const left = pruneAst(ast.left, shouldRemove);
  const right = pruneAst(ast.right, shouldRemove);
  if (!left && !right) return null;
  if (!left) return right;
  if (!right) return left;
  return {
    type: 'logical',
    operator: ast.operator,
    left,
    right,
  };
}
