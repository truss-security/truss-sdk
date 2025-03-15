/**
 * Interface for chain transaction data
 */
export interface ChainTxn {
  sequence_number: number;
  topic_id: string;
  transaction_id: string;
}

/**
 * Interface for security product data
 */
export interface Product {
  id?: string;
  version?: number;
  latestVersion?: number;
  timestamp?: number;
  title?: string;
  author?: string[];
  type: string;
  category: string;
  source: string;
  pubDate?: string;
  reference?: string[];
  tags?: string[];
  industry?: string[];
  region?: string[];
  indicators?: Record<string, string[]>;
  indicatorsHash?: string;
  contributor?: string;
  validators?: string[];
  downloads?: number;
  rating?: number;
  chainTxn?: ChainTxn;
}

/**
 * Interface for search filter parameters
 */
export type SearchFilter = {
  startdate?: number | string
  enddate?: number | string
  days?: number
  category?: string[]
  source?: string[]
  author?: string[]
  industry?: string[]
  region?: string[]
  reference?: string[]
  tags?: string[]
  indicators?: {}
  scanOldestToNewest?: boolean
  LastEvaluatedKey?: LastEvaluatedKey
}

/**
 * Interface for SDK configuration
 */
export interface TrussConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
}

/**
 * Interface for API response
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
}
/**
 * Interface for paginated search results
 */
export interface SearchResponse {
  $metadata: any;
  Count: number;
  Items: Product[];
  ScannedCount: number;
  LastEvaluatedKey?: LastEvaluatedKey;
} 

/**
 * Interface for last evaluated key
 */
export interface LastEvaluatedKey {
  PK: string;
  SK: string;
  GSI1PK?: string;
  GSI1SK?: number;
  GSI2PK?: string;
  GSI2SK?: number;
  GSI3PK?: string;
  GSI3SK?: number;
  GSI4PK?: string;
  GSI4SK?: number;
}