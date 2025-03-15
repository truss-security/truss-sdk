import { config } from 'dotenv';
config();
import { TrussSDK, SearchFilter } from '../src/index.js';

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
      region: ['China', 'Pakistan'], // Will match either category
      startdate: '2025-03-15',
      scanOldestToNewest: true
    };

    const orResults = await sdk.searchProducts(orFilter);
    orResults.data.Items.forEach(item => {
      console.log(`  Source: ${item.source}`);
      console.log(`- ${item.title}`);
      console.log(`  Region: ${item.region}`);
    });

  } catch (error: any) {
    console.error('Failed to search security data:', error.message);
    process.exit(1);
  }
}

// Run the example
filterSearch().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
