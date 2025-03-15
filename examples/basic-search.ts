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