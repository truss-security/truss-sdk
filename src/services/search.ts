import { HttpClient, parseStixPaginationHeaders, toProductSearchFilterExpression } from '../utils/index.js';
import type {
  GlobalSearchRequest,
  GlobalSearchResponse,
  ProductStixResponse,
  SearchProductsStixRequest,
  SearchProductsStixResponse,
  VectorSearchRequest,
  VectorSearchResponse,
  SimilarSearchOptions,
  SimilarSearchResponse,
  SearchProductsRequest,
  SearchProductsResponse,
  SearchProductResponse,
  SmartSearchRequest,
  SmartSearchResponse,
  TrussClientConfig,
} from '../types/index.js';

export class SearchService {
  private readonly http: HttpClient;

  constructor(config: Required<TrussClientConfig>) {
    this.http = new HttpClient(config);
  }

  /**
   * Perform a global search across all products with filtering and pagination
   * 
   * @param params - Search parameters including query, filters, and pagination
   * @returns Promise resolving to search results
   * 
   * @example
   * ```typescript
   * const results = await client.search.global({
   *   query: 'malware',
   *   filterAst: { type: 'comparison', attribute: 'category', operator: '=', value: 'Malware' },
   *   limit: 10,
   *   use_vector_search: true,
   * });
   * ```
   */
  async global(params: GlobalSearchRequest): Promise<GlobalSearchResponse> {
    const response = await this.http.post<GlobalSearchResponse>('/search/global', params);
    return response.data;
  }

  /**
   * Perform a vector similarity search using AI embeddings
   * 
   * @param params - Vector search parameters
   * @returns Promise resolving to vector search results
   * 
   * @example
   * ```typescript
   * const results = await client.search.vector({
   *   query: 'threat intelligence report',
   *   similarity_threshold: 0.7,
   *   include_metadata: true
   * });
   * ```
   */
  async vector(params: VectorSearchRequest): Promise<VectorSearchResponse> {
    const response = await this.http.post<VectorSearchResponse>('/search/vector', params);
    return response.data;
  }

  /**
   * Find products similar to a specific product using vector similarity
   * 
   * @param productId - The ID of the product to find similar products for
   * @param params - Similar products search parameters
   * @returns Promise resolving to similar products
   * 
   * @example
   * ```typescript
   * const similar = await client.search.similar(123, {
   *   limit: 5,
   *   similarity_threshold: 0.8
   * });
   * ```
   */
  async similar(
    productId: number, 
    params: SimilarSearchOptions = {}
  ): Promise<SimilarSearchResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params.similarity_threshold !== undefined) {
      queryParams.append('similarity_threshold', params.similarity_threshold.toString());
    }
    if (params.include_metadata !== undefined) {
      queryParams.append('include_metadata', params.include_metadata.toString());
    }

    const endpoint = `/search/similar/${productId}${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await this.http.get<SimilarSearchResponse>(endpoint);
    return response.data;
  }

  /**
   * Search products with advanced filtering and date range support
   * 
   * @param params - Product search parameters including date filtering
   * @returns Promise resolving to product search results
   * 
   * @example
   * ```typescript
   * const products = await client.search.products({
   *   filterExpression: "category = 'Malware' AND source = 'Test Source'",
   *   startDate: '2024-01-01',
   *   endDate: '2024-12-31',
   * });
   * ```
   */
  async products(params: SearchProductsRequest): Promise<SearchProductsResponse> {
    const response = await this.http.post<SearchProductsResponse>('/product/search', this.normalizeProductSearch(params));
    return response.data;
  }

  /**
   * Fetch every product matching a search by following page-based pagination.
   */
  async productsAll(
    params: SearchProductsRequest,
    options: { maxPages?: number } = {}
  ): Promise<SearchProductResponse[]> {
    const products: SearchProductResponse[] = [];
    for await (const product of this.iterProducts(params, options)) {
      products.push(product);
    }
    return products;
  }

  /**
   * Iterate products one at a time. This is useful for ingestion jobs and agents
   * that want to stream results into their own processing loop.
   */
  async *iterProducts(
    params: SearchProductsRequest,
    options: { maxPages?: number } = {}
  ): AsyncGenerator<SearchProductResponse, void, unknown> {
    const maxPages = options.maxPages ?? Number.POSITIVE_INFINITY;
    let page = params.page ?? 1;
    let pagesRead = 0;

    while (pagesRead < maxPages) {
      const response = await this.products({ ...params, page });
      for (const product of response.products) {
        yield product;
      }

      pagesRead += 1;
      if (!response.hasMore) break;
      page += 1;
    }
  }

  async productStix(productId: number | string): Promise<ProductStixResponse> {
    const response = await this.http.get<ProductStixResponse>(`/product/${productId}/stix`);
    return response.data;
  }

  async productsStix(params: SearchProductsStixRequest): Promise<SearchProductsStixResponse> {
    const response = await this.http.post<ProductStixResponse>('/product/search/stix', params);
    return {
      bundle: response.data,
      pagination: parseStixPaginationHeaders(response.headers),
    };
  }

  /**
   * Perform an intelligent smart search that uses AI to parse natural language queries
   * into structured filters and combines traditional and vector search for optimal results
   * 
   * @param params - Smart search parameters including natural language query
   * @returns Promise resolving to smart search results with parsed filters and optional AI response
   * 
   * @example
   * ```typescript
   * const results = await client.search.smart({
   *   query: 'What are the recent threats for US transportation?',
   *   limit: 10,
   *   generate_response: true
   * });
   * ```
   */
  async smart(params: SmartSearchRequest): Promise<SmartSearchResponse> {
    const response = await this.http.post<SmartSearchResponse>('/search/smart', params);
    const data = response.data;
    
    // Parse the AI response answer if it's a JSON string
    if (data.ai_response?.answer && typeof data.ai_response.answer === 'string') {
      try {
        const parsed = JSON.parse(data.ai_response.answer);
        data.ai_response.answer = parsed;
      } catch {
        // If parsing fails, set success to false and preserve the error
        if (data.ai_response) {
          data.ai_response.success = false;
          data.ai_response.error = data.ai_response.error || 'Failed to parse AI response';
        }
      }
    }
    
    return data;
  }

  private normalizeProductSearch(params: SearchProductsRequest): Omit<SearchProductsRequest, 'filter'> {
    const { filter, filterExpression, ...rest } = params;
    const resolvedFilterExpression = toProductSearchFilterExpression(filter ?? null, filterExpression);
    if (!resolvedFilterExpression) {
      return rest;
    }

    return {
      ...rest,
      filterExpression: resolvedFilterExpression,
    };
  }
}
