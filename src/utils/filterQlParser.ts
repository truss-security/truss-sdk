/**
 * FilterQL → AST (jsep). Used by API and published SDK apps (ESM; see truss-sdk/tsconfig.json).
 */
import jsep from 'jsep';
import type {
  FilterAstNode,
  FilterComparisonOperator,
  FilterLogicalOperator,
  ProductAttribute,
} from '../types/product.js';
import {
  FILTER_QL_ATTRIBUTES,
  FILTER_COMPARISON_OPERATORS,
  FILTER_LOGICAL_OPERATORS,
  FILTER_QL_JSEP_BINARY_OPS,
} from './filterQlGrammar.js';

for (const { name, precedence } of FILTER_QL_JSEP_BINARY_OPS) {
  jsep.addBinaryOp(name, precedence);
}

const COMPARISON_OPS: FilterComparisonOperator[] = [...FILTER_COMPARISON_OPERATORS];
const LOGICAL_OPS: FilterLogicalOperator[] = [...FILTER_LOGICAL_OPERATORS];

export function isValidAttribute(name: string): name is ProductAttribute {
  const normalized = name.toLowerCase();
  return FILTER_QL_ATTRIBUTES.some((attr) => attr.toLowerCase() === normalized);
}

const isValidComparisonOperator = (operator: string): operator is FilterComparisonOperator =>
  COMPARISON_OPS.includes(operator as FilterComparisonOperator);

const isValidLogicalOperator = (operator: string): operator is FilterLogicalOperator =>
  LOGICAL_OPS.includes(operator as FilterLogicalOperator);

const normalizeAttribute = (inputAttribute: string): ProductAttribute | null => {
  const attr = FILTER_QL_ATTRIBUTES.find(
    (candidate) => candidate.toLowerCase() === inputAttribute.toLowerCase()
  );
  return attr ?? null;
};

const parseExpressionNode = (node: jsep.Expression): FilterAstNode | null => {
  if (!node || node.type !== 'BinaryExpression') return null;
  const binaryNode = node as jsep.BinaryExpression;

  if (isValidComparisonOperator(binaryNode.operator)) {
    if (binaryNode.left.type !== 'Identifier' || binaryNode.right.type !== 'Literal') {
      return null;
    }
    const attribute = normalizeAttribute((binaryNode.left as jsep.Identifier).name);
    if (!attribute) return null;
    const value = (binaryNode.right as jsep.Literal).value;
    return {
      type: 'comparison',
      attribute,
      operator: binaryNode.operator,
      value: typeof value === 'string' ? value : String(value),
    };
  }

  if (isValidLogicalOperator(binaryNode.operator)) {
    const left = parseExpressionNode(binaryNode.left);
    const right = parseExpressionNode(binaryNode.right);
    if (!left || !right) return null;
    return {
      type: 'logical',
      operator: binaryNode.operator,
      left,
      right,
    };
  }

  return null;
};

export function parseExpressionToAst(
  expression: string | null | undefined
): { ast: FilterAstNode | null; error: string | null } {
  if (!expression || !expression.trim()) {
    return { ast: null, error: null };
  }
  try {
    const ast = parseExpressionNode(jsep(expression));
    if (!ast) {
      return { ast: null, error: 'Expression contains unsupported operators or structure' };
    }
    return { ast, error: null };
  } catch (error) {
    return { ast: null, error: error instanceof Error ? error.message : 'Failed to parse expression' };
  }
}

export function validateExpressionSyntax(expression: string): boolean {
  if (!expression.trim()) return false;
  return parseExpressionToAst(expression).ast !== null;
}
