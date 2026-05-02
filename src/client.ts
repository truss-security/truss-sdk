import { SearchService } from './services/search.js';
import type { TrussClientConfig } from './types/index.js';

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 250;

/** Shown from getConfig() so logs and debug dumps never include the real key. */
const API_KEY_REDACTED = '[REDACTED]';

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

function assertHttpsOrLocalHttp(baseUrl: string): void {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error(
      'TrussClient: baseUrl must be an absolute URL (e.g. https://api.truss-security.com)'
    );
  }
  if (url.protocol === 'https:') {
    return;
  }
  if (url.protocol === 'http:') {
    const host = url.hostname.startsWith('[')
      ? url.hostname.slice(1, -1).toLowerCase()
      : url.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
      return;
    }
  }
  throw new Error(
    'TrussClient: baseUrl must use https, or http only for localhost, 127.0.0.1, or ::1'
  );
}

export class TrussClient {
  public readonly search: SearchService;
  
  private readonly config: Required<TrussClientConfig>;

  constructor(config: TrussClientConfig) {
    const baseUrl = normalizeBaseUrl(config.baseUrl);
    assertHttpsOrLocalHttp(baseUrl);
    this.config = {
      baseUrl,
      apiKey: config.apiKey || '',
      timeout: config.timeout ?? DEFAULT_TIMEOUT_MS,
      retries: config.retries ?? DEFAULT_RETRIES,
      retryDelayMs: config.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS,
      userAgent: config.userAgent ?? 'truss-api-sdk/0.1.0',
    };

    this.search = new SearchService(this.config);
  }

  /**
   * Get the current configuration (API key is redacted; use {@link setApiKey} / constructor to set secrets).
   */
  getConfig(): Readonly<TrussClientConfig> {
    return {
      ...this.config,
      apiKey: this.config.apiKey ? API_KEY_REDACTED : '',
    };
  }

  /**
   * Update the API key
   */
  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }
}
