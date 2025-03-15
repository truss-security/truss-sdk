import { TrussSDK, SearchFilter } from '../src';

// Load environment variables
const API_KEY = process.env.TRUSS_API_KEY || 'your-api-key';
const API_URL = process.env.TRUSS_API_URL || 'https://api.truss-security.com';

// Initialize the SDK
const sdk = new TrussSDK({
  apiKey: API_KEY,
  baseUrl: API_URL
});

async function paginationExample() {
  try {
    console.log('Demonstrating pagination...');
    let lastKey = undefined;
    let pageNum = 1;
    const maxPages = 3; // Limit for this example

    // Initial search filter
    const filter: SearchFilter = {
      category: ['web'],
      tags: ['critical'],
      days: 30
    };

    do {
      // Add LastEvaluatedKey to filter if we have one
      const searchFilter: SearchFilter = {
        ...filter,
        LastEvaluatedKey: lastKey
      };

      const results = await sdk.searchProducts(searchFilter);
      console.log(`\nPage ${pageNum}:`);
      console.log(`Found ${results.data.items.length} items`);
      
      results.data.items.forEach(item => {
        console.log(`- ${item.title}`);
        console.log(`  Category: ${item.category}`);
        console.log(`  Tags: ${item.tags?.join(', ')}`);
      });

      // Get the LastEvaluatedKey for the next page
      lastKey = results.data.lastEvaluatedKey;
      pageNum++;

      // Stop after maxPages or when there are no more results
      if (pageNum > maxPages || !lastKey) break;

    } while (lastKey);

    if (lastKey) {
      console.log('\nMore results available. Example limited to 3 pages.');
    }

  } catch (error: any) {
    console.error('Failed to search security data:', error.message);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  paginationExample().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
} 