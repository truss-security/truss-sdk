import axios, { AxiosInstance } from 'axios';
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
   * Create a new security product
   * @param product Product data to create
   * @returns Promise with the created product
   */
  async createProduct(product: Product): Promise<ApiResponse<Product>> {
    try {
      const response = await this.client.post<ApiResponse<Product>>('/product/create', product);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to create product: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Search for security products using filters
   * @param filter Search filter parameters
   * @returns Promise with search results
   */
  async searchProducts(filter: SearchFilter): Promise<ApiResponse<SearchResponse>> {
    try {
      const response = await this.client.post<ApiResponse<SearchResponse>>('/product/search', filter);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to search products: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
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