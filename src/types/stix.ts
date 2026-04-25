export type StixObjectType = 'bundle' | 'identity' | 'report' | 'indicator';

export interface StixCommonObject {
  type: StixObjectType;
  id: string;
  spec_version?: '2.1';
  created?: string;
  modified?: string;
}

export interface StixIdentity extends StixCommonObject {
  type: 'identity';
  identity_class: 'organization';
  name: string;
}

export interface StixReport extends StixCommonObject {
  type: 'report';
  name: string;
  report_types: string[];
  published: string;
  object_refs: string[];
  created_by_ref: string;
  description?: string;
  external_references?: Array<{
    source_name: string;
    url?: string;
    description?: string;
  }>;
}

export interface StixIndicator extends StixCommonObject {
  type: 'indicator';
  pattern: string;
  pattern_type: 'stix';
  valid_from: string;
  indicator_types: string[];
  created_by_ref: string;
  name?: string;
  description?: string;
  external_references?: Array<{
    source_name: string;
    url?: string;
    description?: string;
  }>;
}

export type StixObject = StixIdentity | StixReport | StixIndicator;

export interface StixBundle {
  type: 'bundle';
  id: string;
  spec_version: '2.1';
  objects: StixObject[];
}

export type ProductStixResponse = StixBundle;

export interface SearchProductsStixRequest {
  filterExpression?: string;
  startDate?: string | number;
  endDate?: string | number;
  days?: number;
  page?: number;
  limit?: number;
  order_by?: 'pub_date' | 'downloads' | 'rating' | 'timestamp';
  order_direction?: 'asc' | 'desc';
}

export interface StixPaginationHeaders {
  totalCount?: number;
  page?: number;
  totalPages?: number;
  link?: string;
}

export interface SearchProductsStixResponse {
  bundle: StixBundle;
  pagination?: StixPaginationHeaders;
}
