import type { StixPaginationHeaders } from '../types/stix.js';

export function isStixContentType(contentType: string | null | undefined): boolean {
  if (!contentType) return false;
  return contentType.toLowerCase().includes('application/stix+json');
}

function asOptionalInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function parseStixPaginationHeaders(
  headers: Record<string, string | undefined>
): StixPaginationHeaders {
  const out: StixPaginationHeaders = {};
  const totalCount = asOptionalInt(headers['x-total-count']);
  const page = asOptionalInt(headers['x-page']);
  const totalPages = asOptionalInt(headers['x-total-pages']);
  const link = headers.link;

  if (totalCount !== undefined) out.totalCount = totalCount;
  if (page !== undefined) out.page = page;
  if (totalPages !== undefined) out.totalPages = totalPages;
  if (link !== undefined && link !== '') out.link = link;

  return out;
}
