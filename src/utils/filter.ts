import type {
  FilterAstNode,
  FilterComparisonOperator,
  FilterLogicalOperator,
  ProductAttribute,
} from '../types/product.js';
import { filterAstToReadableQl } from './filterAstBuilder.js';

export type FilterInput = FilterAstNode | null | undefined | false;

function comparison(
  attribute: ProductAttribute,
  operator: FilterComparisonOperator,
  value: string
): FilterAstNode {
  return {
    type: 'comparison',
    attribute,
    operator,
    value,
  };
}

function combine(operator: FilterLogicalOperator, nodes: FilterInput[]): FilterAstNode | null {
  const validNodes = nodes.filter((node): node is FilterAstNode => Boolean(node));
  if (validNodes.length === 0) return null;
  if (validNodes.length === 1) return validNodes[0]!;

  return validNodes.slice(1).reduce<FilterAstNode>(
    (left, right) => ({
      type: 'logical',
      operator,
      left,
      right,
    }),
    validNodes[0]!
  );
}

/**
 * Small typed helper for building FilterQL-compatible filters.
 */
export const filter = {
  eq: (attribute: ProductAttribute, value: string): FilterAstNode => comparison(attribute, '=', value),
  notEq: (attribute: ProductAttribute, value: string): FilterAstNode => comparison(attribute, '!=', value),
  like: (attribute: ProductAttribute, value: string): FilterAstNode => comparison(attribute, 'LIKE', value),
  anyOf: (attribute: ProductAttribute, values: string[]): FilterAstNode | null =>
    combine('OR', values.map((value) => comparison(attribute, '=', value))),
  and: (...nodes: FilterInput[]): FilterAstNode | null => combine('AND', nodes),
  or: (...nodes: FilterInput[]): FilterAstNode | null => combine('OR', nodes),
  expression: (node: FilterInput): string => filterAstToReadableQl(node || null),
};
