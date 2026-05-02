import { HttpClient, parseStixPaginationHeaders, toProductSearchFilterExpression } from '../utils/index.js';
import type {
  GetProductResponse,
  ProductStixResponse,
  SearchProductsStixRequest,
  SearchProductsStixResponse,
  SearchProductsRequest,
  SearchProductsResponse,
  SearchProductResponse,
  TrussClientConfig,
} from '../types/index.js';

export class SearchService {
  protected readonly http: HttpClient;

  constructor(config: Required<TrussClientConfig>) {
    this.http = new HttpClient(config);
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
  /**
   * Fetch one product as JSON (numeric id or `truss_prod_id` ULID string).
   */
  async product(productId: number | string): Promise<SearchProductResponse> {
    const response = await this.http.get<GetProductResponse>(`/product/${productId}`);
    return response.data.product;
  }

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

  /**
   * Fetch a product as a STIX bundle
   * 
   * @param productId - The ID of the product to fetch
   * @returns Promise resolving to the product as a STIX bundle
   */
  async productStix(productId: number | string): Promise<ProductStixResponse> {
    const response = await this.http.get<ProductStixResponse>(`/product/${productId}/stix`);
    return response.data;
  }

  /**
   * Search products as a STIX bundle
   * 
   * @param params - The parameters for the search
   * @returns Promise resolving to the search results as a STIX bundle
   */
  async productsStix(params: SearchProductsStixRequest): Promise<SearchProductsStixResponse> {
    const response = await this.http.post<ProductStixResponse>('/product/search/stix', params);
    return {
      bundle: response.data,
      pagination: parseStixPaginationHeaders(response.headers),
    };
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
