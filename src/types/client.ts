export interface TrussClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  retryDelayMs?: number;
  userAgent?: string;
}