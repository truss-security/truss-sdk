# Truss Security SDK

A TypeScript SDK for contributing and accessing security data through the Truss Security API.

## Installation

```bash
npm install @truss-security/sdk
```

## Set up environment

Copy env.example to .env and set your API key.

## Usage

### Initialize the SDK

```typescript
import { TrussSDK } from '@truss-security/sdk';

const sdk = new TrussSDK({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.truss-security.com',
  timeout: 10000 // optional, defaults to 10000ms
});
```

### Create a Security Product

```typescript
import { Product } from '@truss-security/sdk';

const product: Product = {
  title: 'Security Alert',
  type: 'alert',
  category: 'malware',
  source: 'internal',
  author: ['security-team'],
  industry: ['technology'],
  region: ['north-america'],
  indicators: {
    ip: ['192.168.1.1'],
    domain: ['malicious.com']
  },
  tags: ['ransomware', 'critical']
};

try {
  const result = await sdk.createProduct(product);
  console.log('Created product:', result.data);
} catch (error) {
  console.error('Failed to create product:', error);
}
```

### Search Security Products

```typescript
import { SearchFilter } from '@truss-security/sdk';

const filter: SearchFilter = {
  category: ['malware'],
  source: ['internal'],
  startdate: '2025-01-01',
  enddate: '2025-01-15',
  tags: ['ransomware'],
  scanOldestToNewest: false
};

try {
  const result = await sdk.searchProducts(filter);
  console.log('Search results:', result.data.items);
  
  // Handle pagination if needed
  if (result.data.lastEvaluatedKey) {
    console.log('More results available');
  }
} catch (error) {
  console.error('Failed to search products:', error);
}
```

## API Reference

### TrussSDK

#### Constructor

```typescript
new TrussSDK(config: TrussConfig)
```

Configuration options:
- `apiKey` (required): Your Truss API key
- `baseUrl` (required): The base URL of the Truss API
- `timeout` (optional): Request timeout in milliseconds (default: 10000)

#### Methods

##### createProduct

```typescript
createProduct(product: Product): Promise<ApiResponse<Product>>
```

Create a new security product in the Truss platform.

##### searchProducts

```typescript
searchProducts(filter: SearchFilter): Promise<ApiResponse<SearchResponse>>
```

Search for security products using various filter criteria.

##### getConfig

```typescript
getConfig(): TrussConfig
```

Get the current SDK configuration.

##### updateConfig

```typescript
updateConfig(config: Partial<TrussConfig>): void
```

Update the SDK configuration.

### Types

#### Product

```typescript
interface Product {
  id?: string;
  title?: string;
  type: string;
  category: string;
  source: string;
  author?: string[];
  industry?: string[];
  region?: string[];
  indicators?: Record<string, string[]>;
  tags?: string[];
  // ... other properties
}
```

#### SearchFilter

```typescript
interface SearchFilter {
  startdate?: number | string;
  enddate?: number | string;
  days?: number;
  category?: string[];
  source?: string[];
  author?: string[];
  industry?: string[];
  region?: string[];
  tags?: string[];
  indicators?: Record<string, any>;
  scanOldestToNewest?: boolean;
}
```

## Error Handling

The SDK throws errors with descriptive messages when API calls fail. Always wrap SDK calls in try-catch blocks to handle potential errors gracefully.

## Development

```bash
# Install dependencies
npm install

# Build the SDK
npm run build

# Run tests
npm test

# Run linter
npm run lint
```

## License

MIT

## Support

For support, please contact support@truss-security.com or open an issue on our GitHub repository.

## Examples

The SDK comes with example scripts demonstrating common use cases. You can find these in the `examples` directory.

### Basic Search

The `basic-search.ts` script demonstrates a simple search for security data:

```bash
# Set your API credentials
export TRUSS_API_KEY="your-api-key"
export TRUSS_API_URL="https://api.truss-security.com"

# Run the example
npx ts-node examples/basic-search.ts
```

This script shows how to:
- Search for recent ransomware threats
- Filter by category and tags
- Process and display search results

### Date-Based Search

The `date-search.ts` script shows different ways to search by date:

```bash
# Run the example
npx ts-node examples/date-search.ts
```

This script demonstrates:
- Searching by date range (startdate/enddate)
- Searching by relative time (days)
- Handling date-based results

### Boolean Filters

The `filter-search.ts` script shows how to use boolean filters:

```bash
# Run the example
npx ts-node examples/filter-search.ts
```

This script demonstrates:
- OR filtering within a single parameter
- AND filtering across multiple parameters
- Complex filtering with multiple criteria

### Pagination

The `pagination.ts` script shows how to handle large result sets:

```bash
# Run the example
npx ts-node examples/pagination.ts
```

This script demonstrates:
- Using LastEvaluatedKey for pagination
- Processing results page by page
- Handling pagination state

### Contributing Security Data

The `contribute-security-data.ts` script demonstrates how to contribute security data from a JSON file:

```bash
# Run the example
npx ts-node examples/contribute-security-data.ts
```

This script:
- Reads security data from `examples/data/sample-security-data.json`
- Processes each security product
- Submits them to the Truss API
- Handles errors and provides detailed output

### Sample Data

The `examples/data` directory contains sample security data that you can use to test the SDK:
- `sample-security-data.json`: Contains example security products with various indicators and metadata 