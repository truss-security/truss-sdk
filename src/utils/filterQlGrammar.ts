import type {
  FilterComparisonOperator,
  FilterLogicalOperator,
  ProductAttribute,
} from '../types/product.js';

/** Comparison operators for FilterQL (jsep binary ops, same precedence). */
export const FILTER_COMPARISON_OPERATORS = ['=', '!=', 'LIKE'] as const satisfies readonly FilterComparisonOperator[];

/** Logical connectors for FilterQL (jsep binary ops, AND binds tighter than OR). */
export const FILTER_LOGICAL_OPERATORS = ['AND', 'OR'] as const satisfies readonly FilterLogicalOperator[];

/** Same operators as {@link FILTER_LOGICAL_OPERATORS}; OR first for autocomplete ordering. */
export const FILTER_LOGICAL_OPERATORS_SUGGESTION_ORDER = ['OR', 'AND'] as const satisfies readonly FilterLogicalOperator[];

/**
 * jsep registration: name + precedence (higher binds tighter).
 * Must stay in sync with FILTER_COMPARISON_OPERATORS and FILTER_LOGICAL_OPERATORS.
 */
export const FILTER_QL_JSEP_BINARY_OPS: readonly { name: string; precedence: number }[] = [
  { name: '=', precedence: 10 },
  { name: '!=', precedence: 10 },
  { name: 'LIKE', precedence: 10 },
  { name: 'OR', precedence: 3 },
  { name: 'AND', precedence: 2 },
];

/**
 * Fields allowed in FilterQL comparisons. Single source for parser, API, and UI autocomplete.
 */
export const FILTER_QL_ATTRIBUTES: readonly ProductAttribute[] = [
  'category',
  'source',
  'type',
  'title',
  'author',
  'industry',
  'region',
  'reference',
  'tags',
  'validators',
  'indicators',
];

/**
 * Single characters that trigger operator/paren token boundaries in the FilterQLCard tokenizer
 * (must cover =, !=, LIKE, AND, OR, parentheses).
 */
export const FILTER_QL_TOKENIZER_SPLIT_CHARS = [
  '=',
  '!',
  'L',
  'I',
  'K',
  'E',
  'A',
  'N',
  'D',
  'O',
  'R',
  '(',
  ')',
] as const;

export const FILTER_QL_TOKENIZER_SPLIT_CHAR_SET = new Set<string>(FILTER_QL_TOKENIZER_SPLIT_CHARS);

export function isFilterComparisonToken(token: string): token is FilterComparisonOperator {
  return (FILTER_COMPARISON_OPERATORS as readonly string[]).includes(token);
}

export function isFilterLogicalToken(token: string): token is FilterLogicalOperator {
  return (FILTER_LOGICAL_OPERATORS as readonly string[]).includes(token);
}
