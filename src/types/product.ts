export type ProductAttribute =
  | 'category'
  | 'region'
  | 'industry'
  | 'source'
  | 'author'
  | 'tags'
  | 'reference'
  | 'indicators'
  | 'title'
  | 'type'
  | 'validators';

export interface ProductCore {
  id?: number;
  timestamp?: Date;
  truss_prod_id?: string;
  version?: number;
  latest_version?: number;
  title?: string;
  type: string;
  category: string;
  source: string;
  pub_date?: Date;
  indicators_hash?: string;
  downloads?: number;
  rating?: number;
}

export interface ProductRelations {
  author?: string[];
  industry?: string[];
  region?: string[];
  tags?: string[];
  validators?: string[];
  reference?: string[];
}

/** Public API product shape (search, GET product, etc.). Embedding vectors are internal-only — see `@truss-security/truss-sdk-internal`. */
export interface Product extends ProductCore, ProductRelations {
  indicators?: Record<string, string[]>;
}

export type FilterComparisonOperator = '=' | '!=' | 'LIKE';
export type FilterLogicalOperator = 'AND' | 'OR';

export type FilterAstNode =
  | {
      type: 'comparison';
      attribute: ProductAttribute;
      operator: FilterComparisonOperator;
      value: string;
    }
  | {
      type: 'logical';
      operator: FilterLogicalOperator;
      left: FilterAstNode;
      right: FilterAstNode;
    };