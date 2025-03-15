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

async function basicSearch() {
  try {
    // Basic search for recent critical ransomware threats
    console.log('Searching for recent critical ransomware threats...');
    const searchFilter: SearchFilter = {
      category: ['Malware'],
      tags: ['opendir', 'mirai'],
      startdate: '2025-03-08',
      enddate: '2025-03-14'
    };

    const results = await sdk.searchProducts(searchFilter);
    console.log(`Found ${results.data.Items.length} matching threats`);
    
    results.data.Items.forEach(item => {
      console.log(`- ${item.title} (${item.category})`);
      console.log(`  Tags: ${item.tags?.join(', ')}`);
      console.log(`  Category: ${item.category}`);
    });

  } catch (error: any) {
    console.error('Failed to search security data:', error.message);
    process.exit(1);
  }
}

// Run the example
basicSearch().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 