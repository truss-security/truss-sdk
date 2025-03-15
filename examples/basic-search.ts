import { TrussSDK, SearchFilter } from '../src';

// Load environment variables
const API_KEY = process.env.TRUSS_API_KEY || 'your-api-key';
const API_URL = process.env.TRUSS_API_URL || 'https://api.truss-security.com';

// Initialize the SDK
const sdk = new TrussSDK({
  apiKey: API_KEY,
  baseUrl: API_URL
});

async function basicSearch() {
  try {
    // Basic search for recent critical ransomware threats
    console.log('Searching for recent critical ransomware threats...');
    const searchFilter: SearchFilter = {
      category: ['malware'],
      tags: ['ransomware', 'critical'],
      days: 30 // Last 30 days
    };

    const results = await sdk.searchProducts(searchFilter);
    console.log(`Found ${results.data.items.length} matching threats`);
    
    results.data.items.forEach(item => {
      console.log(`- ${item.title} (${item.category})`);
      console.log(`  Tags: ${item.tags?.join(', ')}`);
      console.log(`  Indicators: ${Object.keys(item.indicators || {}).join(', ')}`);
    });

  } catch (error: any) {
    console.error('Failed to search security data:', error.message);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  basicSearch().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
} 