import { SearchService } from './services/search.js';
import type { TrussClientConfig } from './types/index.js';

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 250;

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

export class TrussClient {
  public readonly search: SearchService;
  
  private readonly config: Required<TrussClientConfig>;

  constructor(config: TrussClientConfig) {
    this.config = {
      baseUrl: normalizeBaseUrl(config.baseUrl),
      apiKey: config.apiKey || '',
      timeout: config.timeout ?? DEFAULT_TIMEOUT_MS,
      retries: config.retries ?? DEFAULT_RETRIES,
      retryDelayMs: config.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS,
      userAgent: config.userAgent ?? 'truss-api-sdk/0.1.0',
    };

    this.search = new SearchService(this.config);
  }

  /**
   * Get the current configuration
   */
  getConfig(): Readonly<TrussClientConfig> {
    return { ...this.config };
  }

  /**
   * Update the API key
   */
  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }
}
