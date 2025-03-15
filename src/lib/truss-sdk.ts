import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Product, SearchFilter, TrussConfig, ApiResponse, SearchResponse } from './types';

/**
 * TrussSDK - Client SDK for interacting with the Truss Security API
 */
export class TrussSDK {
  private client: AxiosInstance;
  private config: TrussConfig;

  /**
   * Create a new instance of the TrussSDK
   * @param config SDK configuration
   */
  constructor(config: TrussConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey
      }
    });
  }

  /**
   * Internal method for making API calls to Truss endpoints
   * @param server Base server URL
   * @param endpoint API endpoint
   * @param data Request payload
   * @returns Promise with the API response
   */
  private trussApi = async (endpoint: string, data: any): Promise<any> => {
    try {
      const response = await axios({
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey
        },
        data,
        url: `${this.config.baseUrl}${endpoint}`,
        timeout: this.config.timeout || 10000
      })
      return response
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw new Error(`API Error: ${err.response?.data?.message || err.message}`);
      }
      throw err;
    }
  }

  /**
   * Create a new security product
   * @param product Product data to create
   * @returns Promise with the created product
   */
  async createProduct(product: Product): Promise<ApiResponse<Product>> {
    return this.trussApi('/product/create', product);
  }

  /**
   * Search for security products using filters
   * @param filter Search filter parameters
   * @returns Promise with search results
   */
  async searchProducts(filter: SearchFilter): Promise<ApiResponse<SearchResponse>> {
    return this.trussApi('/product/search', filter);
  }

  /**
   * Get the current SDK configuration
   * @returns The current configuration
   */
  getConfig(): TrussConfig {
    return { ...this.config };
  }

  /**
   * Update the SDK configuration
   * @param config New configuration options
   */
  updateConfig(config: Partial<TrussConfig>): void {
    this.config = { ...this.config, ...config };
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey
      }
    });
  }
} 