import type { Product, FilterAstNode } from './product.js';
export type { ProductStixResponse, SearchProductsStixRequest, SearchProductsStixResponse } from './stix.js';

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

//========== AI Response Types ==========

export interface AIResponseRequest {
  query: string;
  searchResults: GlobalSearchResponse;
  maxResults?: number; // Number of search results to include in prompt
}

export type AIQueryRequest = AIResponseRequest & { query: string };

export interface AIResponseAnswer {
  summary: string;
  content: AIResponseContent[];
}

export interface AIResponse {
  answer: AIResponseAnswer | string;
  success: boolean;
  error?: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIResponseContent {
  type: 'threat_summaries' | 'detailed_product_results';
  threat?: string;
  description?: string;
  resultNumbers?: number[];
  title?: string;
  author?: string;
  summary?: string;
}

//========== Global Search Types ==========

export interface GlobalSearchOptions {
  /** Optional filter AST. Not used by POST /product/search (that endpoint uses `filterExpression` FilterQL). */
  filterAst?: FilterAstNode;
  limit?: number;
  page?: number;
  /** Timestamp window (same semantics as POST /product/search date fields). */
  startDate?: string | number;
  endDate?: string | number;
  days?: number;
  similarity_threshold?: number;
  /** When false, runs AST-only traditional search with no embeddings. */
  use_vector_search?: boolean;
}

export type GlobalSearchRequest = GlobalSearchOptions & { query: string };

/**
 * `GlobalSearchOptions` after POST /search/global validation and defaults
 * (`limit`, `page`, `similarity_threshold`, `use_vector_search` always set).
 */
export type ResolvedGlobalSearchOptions = GlobalSearchOptions & {
  limit: number;
  page: number;
  similarity_threshold: number;
  use_vector_search: boolean;
};

export interface GlobalSearchResponse {
  products: SearchProductResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  search_method: 'vector' | 'traditional' | 'hybrid';
  vector_results_count?: number;
  traditional_results_count?: number;
}

//========== Vector Search Types ==========

export interface VectorSearchOptions {
  limit?: number;
  similarity_threshold?: number;
  include_metadata?: boolean;
}

export type VectorSearchRequest = VectorSearchOptions & { query: string };

/**
 * `VectorSearchOptions` after POST /search/vector validation and defaults
 * (all fields set; same object apps should mirror when building a fully-specified request).
 */
export type ResolvedVectorSearchOptions = Required<VectorSearchOptions>;

export interface VectorSearchResponse {
  results: SearchProductResponse[];
  total: number;
  query?: string;
  search_type: 'vector';
  similarity_threshold: number;
}

//========== Similar Product Search Types ==========

// was SimilarSearchOptions
export interface SimilarSearchOptions {
  limit?: number;
  similarity_threshold?: number;
  include_metadata?: boolean;
}

// was SimilarSearchResponse
export interface SimilarSearchResponse {
  results: SearchProductResponse[];
  total: number;
  product_id: number;
  search_type: 'similar';
  similarity_threshold: number;
}

//========== Search Products Types ==========

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

export interface SearchProductsResponse {
  products: SearchProductResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  debug?: {
    searchParams: Record<string, unknown>;
    resultCount: number;
    hasStartDate: boolean;
    hasEndDate: boolean;
    hasDays: boolean;
    startDateValue: string | number | undefined;
    endDateValue: string | number | undefined;
    daysValue: number | undefined;
  };
}

//========== Smart Search Types ==========

export interface SmartSearchOptions {
  limit?: number;
  page?: number;
  similarity_threshold?: number;
  use_vector_search?: boolean;
  generate_response?: boolean;  // If true, include AI-generated conversational response
  max_results_for_response?: number;  // Number of results to include in AI response prompt
}

export type SmartSearchRequest = SmartSearchOptions & { query: string };

export interface SmartSearchResponse extends GlobalSearchResponse {
  parsed_filters?: {
    industry?: string[];
    region?: string[];
    date_from?: string;
    date_to?: string;
    category?: string[];
    source?: string[];
    [key: string]: unknown;
  };
  cleaned_query?: string;
  ai_response?: AIResponse;
}

