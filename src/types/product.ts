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

export interface ProductEmbeddings {
  title_embedding?: number[];
  content_embedding?: number[];
}

export interface Product extends ProductCore, ProductRelations, ProductEmbeddings {
  indicators?: Record<string, string[]>;
}

export type CreateProductRequest = Omit<Product, 'id' | 'timestamp' | 'truss_prod_id' | 'version' | 'latest_version'> & { generateEmbeddings?: boolean };

// Processed product result
export interface ProcessedProduct extends ProductCore,ProductRelations {
  processedIndicators: Array<{
    originalValue: string;
    normalizedValue: string;
    type: string;
    isValid: boolean;
    indicatorValueId: number;
  }>;
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