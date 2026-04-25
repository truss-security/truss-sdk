# Truss API SDK

TypeScript SDK for pulling Truss API data into applications, ingestion jobs, and agents.

## Installation

```bash
npm install @truss-security/truss-sdk
```

Node 18 or newer is required because the SDK uses the built-in `fetch` API.

## Run Examples Quickly

Set your API credentials once:

```bash
cp env.example .env
```

Then run an example from this repo:

```bash
npm install
npm run example
npm run example:basic
npm run example:typed-filter
npm run example:iterate
npm run example:smart
npm run example:stix
```

`npm run example` opens an interactive picker in a terminal. In CI or non-interactive output, it prints the available examples instead.

You can also run examples directly by name:

```bash
npm run example -- basic
npm run example -- typed-filter
npm run example -- iterate
npm run example -- smart
npm run example -- stix
```

To print the list without opening the picker, use `--list`:

```bash
npm run example -- --list
```

Each example prints a concise human-readable summary. Add `--json` when you want the raw response:

```bash
npm run example -- basic --json
```

Once published, users can try the same runner without cloning the repo:

```bash
npx @truss-security/truss-sdk examples
npx @truss-security/truss-sdk examples --list
npx @truss-security/truss-sdk examples basic
npx @truss-security/truss-sdk examples smart --json
```

## Quick Start

```typescript
import { TrussClient, filter } from '@truss-security/truss-sdk';

const truss = new TrussClient({
  baseUrl: 'https://api.truss-security.com',
  apiKey: process.env.TRUSS_API_KEY,
});

const results = await truss.search.products({
  filter: filter.and(
    filter.eq('category', 'Malware'),
    filter.anyOf('region', ['North America', 'Europe'])
  ),
  days: 7,
  limit: 25,
});

console.log(results.products);
```

## Search Products

Use `search.products` when you want structured product data for your app.

```typescript
const page = await truss.search.products({
  filterExpression: "category = 'Phishing' AND source = 'OpenPhish'",
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  page: 1,
  limit: 50,
});
```

For ingestion jobs and agents, use the pagination helpers instead of writing page loops.

```typescript
for await (const product of truss.search.iterProducts({ days: 7, limit: 100 })) {
  await indexProduct(product);
}
```

```typescript
const products = await truss.search.productsAll(
  { days: 7, limit: 100 },
  { maxPages: 10 }
);
```

## AI and Vector Search

Use semantic search when users or agents have natural-language intent.

```typescript
const vectorResults = await truss.search.vector({
  query: 'recent ransomware activity against hospitals',
  limit: 10,
  similarity_threshold: 0.75,
});
```

Use smart search when you want the API to parse natural language into filters and optionally produce a response.

```typescript
const answer = await truss.search.smart({
  query: 'What are the latest phishing threats in North America?',
  limit: 10,
  generate_response: true,
});
```

## STIX

The SDK exposes STIX endpoints for security tooling interoperability.

```typescript
const bundle = await truss.search.productStix(123);

const stixResults = await truss.search.productsStix({
  filterExpression: "category = 'Malware'",
  days: 14,
  limit: 50,
});
```

## Filters

You can pass raw FilterQL with `filterExpression`, or use the typed `filter` helper.

```typescript
const productFilter = filter.and(
  filter.eq('category', 'Malware'),
  filter.notEq('source', 'Example Source'),
  filter.like('title', 'ransomware')
);

const filterExpression = filter.expression(productFilter);
```

Supported filter attributes are exported as TypeScript types and include `category`, `source`, `type`, `title`, `author`, `industry`, `region`, `reference`, `tags`, `validators`, and `indicators`.

## Configuration

```typescript
const truss = new TrussClient({
  baseUrl: 'https://api.truss-security.com',
  apiKey: process.env.TRUSS_API_KEY,
  timeout: 30_000,
  retries: 3,
  retryDelayMs: 250,
  userAgent: 'my-app/1.0',
});

truss.setApiKey('new-api-key');
```

Requests retry network failures, timeouts, and common transient HTTP statuses: `408`, `429`, `500`, `502`, `503`, and `504`.

## Error Handling

```typescript
import { TrussApiError, TrussTimeoutError } from '@truss-security/truss-sdk';

try {
  await truss.search.products({ days: 7 });
} catch (error) {
  if (error instanceof TrussApiError) {
    console.error(error.status, error.response.data);
  } else if (error instanceof TrussTimeoutError) {
    console.error('Request timed out');
  } else {
    throw error;
  }
}
```

## Development

```bash
npm install
npm run build
npm run example
```
