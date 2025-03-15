import { TrussSDK, SearchFilter } from '../src';

// Load environment variables
const API_KEY = process.env.TRUSS_API_KEY || 'your-api-key';
const API_URL = process.env.TRUSS_API_URL || 'https://api.truss-security.com';

// Initialize the SDK
const sdk = new TrussSDK({
  apiKey: API_KEY,
  baseUrl: API_URL
});

async function dateSearch() {
  try {
    // Example 1: Search by date range
    console.log('\nSearching by date range...');
    const dateRangeFilter: SearchFilter = {
      startdate: '2024-06-02',
      enddate: '2024-06-03',
      category: ['malware']
    };

    const dateResults = await sdk.searchProducts(dateRangeFilter);
    console.log(`Found ${dateResults.data.items.length} items in date range`);
    dateResults.data.items.forEach(item => {
      console.log(`- ${item.title}`);
      console.log(`  Published: ${item.pubDate}`);
    });

    // Example 2: Search by days
    console.log('\nSearching by days...');
    const daysFilter: SearchFilter = {
      days: 7, // Last 7 days
      category: ['web']
    };

    const daysResults = await sdk.searchProducts(daysFilter);
    console.log(`Found ${daysResults.data.items.length} items in last 7 days`);
    daysResults.data.items.forEach(item => {
      console.log(`- ${item.title}`);
      console.log(`  Published: ${item.pubDate}`);
    });

  } catch (error: any) {
    console.error('Failed to search security data:', error.message);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  dateSearch().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
} 