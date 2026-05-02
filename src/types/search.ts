import type { Product, FilterAstNode } from './product.js';

//========== Search Product Type ==========

/**
 * Product with additional fields added by search APIs
 * Extends the base Product type with search-specific metadata
 */
export interface SearchProductResponse extends Product {
  /** Similarity score from vector search (0-1) */
  similarity_score?: number;
  /** Product description (may be included in search results) */
  description?: string;
}

//========== Search Products Types (public POST /product/search) ==========

/** POST /product/search — send `filterExpression` (FilterQL string) only; do not send `filterAst`. */
export interface SearchProductsRequest {
  /** FilterQL, e.g. `category = 'Malware' AND source = 'Test Source'` */
  filterExpression?: string;
  /** Typed filter AST. The SDK serializes this to `filterExpression` before calling the API. */
  filter?: FilterAstNode | null;
  startDate?: string | number;
  endDate?: string | number;
  days?: number;
  page?: number;
  limit?: number;
  order_by?: 'pub_date' | 'downloads' | 'rating' | 'timestamp';
  order_direction?: 'asc' | 'desc';
}

/** GET /product/{id} — response body from the API */
export interface GetProductResponse {
  product: SearchProductResponse;
}

export interface SearchProductsResponse {
  products: SearchProductResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
