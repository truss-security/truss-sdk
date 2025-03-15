import { TrussSDK, SearchFilter } from '../src';

// Load environment variables
const API_KEY = process.env.TRUSS_API_KEY || 'your-api-key';
const API_URL = process.env.TRUSS_API_URL || 'https://api.truss-security.com';

// Initialize the SDK
const sdk = new TrussSDK({
  apiKey: API_KEY,
  baseUrl: API_URL
});

async function filterSearch() {
  try {
    // Example 1: OR filtering within a parameter
    console.log('\nSearching with OR filters...');
    const orFilter: SearchFilter = {
      category: ['ransomware', 'osint'], // Will match either category
      days: 30
    };

    const orResults = await sdk.searchProducts(orFilter);
    console.log(`Found ${orResults.data.items.length} items matching either category`);
    orResults.data.items.forEach(item => {
      console.log(`- ${item.title} (${item.category})`);
    });

    // Example 2: AND filtering across parameters
    console.log('\nSearching with AND filters...');
    const andFilter: SearchFilter = {
      category: ['ransomware'],
      source: ['TOR Project'],
      industry: ['finance'],
      region: ['europe'],
      tags: ['C2', 'AlphV']
    };

    const andResults = await sdk.searchProducts(andFilter);
    console.log(`Found ${andResults.data.items.length} items matching all criteria`);
    andResults.data.items.forEach(item => {
      console.log(`- ${item.title}`);
      console.log(`  Category: ${item.category}`);
      console.log(`  Source: ${item.source}`);
      console.log(`  Industry: ${item.industry?.join(', ')}`);
      console.log(`  Region: ${item.region?.join(', ')}`);
      console.log(`  Tags: ${item.tags?.join(', ')}`);
    });

  } catch (error: any) {
    console.error('Failed to search security data:', error.message);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  filterSearch().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
} 