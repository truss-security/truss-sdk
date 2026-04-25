import type { TrussClientConfig } from '../types/index.js';

export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export class TrussApiError<T = unknown> extends Error {
  readonly status: number;
  readonly response: HttpResponse<T>;

  constructor(message: string, response: HttpResponse<T>) {
    super(message);
    this.name = 'TrussApiError';
    this.status = response.status;
    this.response = response;
  }
}

export class TrussTimeoutError extends Error {
  readonly status = 408;

  constructor(timeoutMs: number) {
    super(`Request timeout after ${timeoutMs}ms`);
    this.name = 'TrussTimeoutError';
  }
}

export class TrussNetworkError extends Error {
  readonly cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'TrussNetworkError';
    if (options && 'cause' in options) {
      this.cause = options.cause;
    }
  }
}

export class HttpClient {
  private readonly config: Required<TrussClientConfig>;

  constructor(config: Required<TrussClientConfig>) {
    this.config = config;
  }

  /**
   * Make an HTTP request
   */
  async request<T = unknown>(
    method: string,
    endpoint: string,
    data?: unknown,
    options: RequestInit = {}
  ): Promise<HttpResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        return await this.send<T>(url, method, data, options);
      } catch (error) {
        if (!this.shouldRetry(error) || attempt === this.config.retries) {
          throw error;
        }
        await this.sleep(this.retryDelay(attempt));
      }
    }

    throw new TrussNetworkError('Request failed without a response');
  }

  /**
   * GET request
   */
  async get<T = unknown>(endpoint: string, options?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  /**
   * POST request
   */
  async post<T = unknown>(endpoint: string, data?: unknown, options?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>('POST', endpoint, data, options);
  }

  private async send<T>(
    url: string,
    method: string,
    data: unknown,
    options: RequestInit
  ): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const requestInit: RequestInit = {
        ...options,
        method,
        headers: this.buildHeaders(options.headers),
        signal: controller.signal,
      };

      if (data !== undefined && method !== 'GET') {
        requestInit.body = JSON.stringify(data);
      } else if (options.body !== undefined && options.body !== null) {
        requestInit.body = options.body;
      }

      const response = await fetch(url, requestInit);

      const httpResponse: HttpResponse<T> = {
        data: await this.parseBody<T>(response),
        status: response.status,
        statusText: response.statusText,
        headers: this.parseHeaders(response.headers),
      };

      if (!response.ok) {
        throw new TrussApiError(`HTTP ${response.status}: ${response.statusText}`, httpResponse);
      }

      return httpResponse;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TrussTimeoutError(this.config.timeout);
      }
      if (error instanceof TrussApiError || error instanceof TrussTimeoutError) {
        throw error;
      }
      throw new TrussNetworkError(error instanceof Error ? error.message : 'Network request failed', { cause: error });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildHeaders(headersInit: RequestInit['headers']): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-truss-sdk-user-agent': this.config.userAgent,
    };

    if (this.config.apiKey) {
      headers['x-api-key'] = this.config.apiKey;
    }

    const incoming = new Headers(headersInit);
    incoming.forEach((value, key) => {
      headers[key] = value;
    });

    return headers;
  }

  private async parseBody<T>(response: Response): Promise<T> {
    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return text as T;
    }
  }

  private shouldRetry(error: unknown): boolean {
    if (error instanceof TrussTimeoutError || error instanceof TrussNetworkError) {
      return true;
    }
    if (error instanceof TrussApiError) {
      return [408, 429, 500, 502, 503, 504].includes(error.status);
    }
    return false;
  }

  private retryDelay(attempt: number): number {
    return this.config.retryDelayMs * 2 ** attempt;
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private parseHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
}
