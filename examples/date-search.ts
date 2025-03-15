import { config } from 'dotenv';
config();
import { TrussSDK, SearchFilter } from '../src/index.js';

// Load environment variables
if (!process.env.TRUSS_API_KEY) {
  throw new Error('TRUSS_API_KEY environment variable is required');
}

if (!process.env.TRUSS_API_URL) {
  throw new Error('TRUSS_API_URL environment variable is required');
}

// Initialize the SDK
const sdk = new TrussSDK({
  apiKey: process.env.TRUSS_API_KEY,
  baseUrl: process.env.TRUSS_API_URL
});

async function dateSearch() {
  try {
    console.log('\nSearching by date range...');
    const dateRangeFilter: SearchFilter = {
      startdate: '2025-02-02',
      enddate: '2025-04-15',
      category: ['Phishing']
    };

    const dateResults = await sdk.searchProducts(dateRangeFilter);
    dateResults.data.Items.forEach(item => {
      console.log(`  Source: ${item.source}`);
      console.log(`- ${item.title}`);
      console.log(`  Published: ${item.pubDate}`);
    });
  } catch (error: any) {
    console.error('Failed to search security data:', error.message);
    process.exit(1);
  }
}

// Run the example
dateSearch().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
