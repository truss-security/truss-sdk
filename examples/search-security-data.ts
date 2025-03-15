import { TrussSDK, SearchFilter } from '../src';

// Load environment variables
const API_KEY = process.env.TRUSS_API_KEY || 'your-api-key';
const API_URL = process.env.TRUSS_API_URL || 'https://api.truss-security.com';

// Initialize the SDK
const sdk = new TrussSDK({
  apiKey: API_KEY,
  baseUrl: API_URL
});

async function searchSecurityData() {
  try {
    // Example 1: Search for recent critical ransomware threats
    console.log('\nSearching for recent critical ransomware threats...');
    const ransomwareFilter: SearchFilter = {
      category: ['malware'],
      tags: ['ransomware', 'critical'],
      days: 30, // Last 30 days
      scanOldestToNewest: false
    };

    const ransomwareResults = await sdk.searchProducts(ransomwareFilter);
    console.log(`Found ${ransomwareResults.data.items.length} ransomware threats`);
    ransomwareResults.data.items.forEach(item => {
      console.log(`- ${item.title} (${item.category})`);
      console.log(`  Indicators: ${Object.keys(item.indicators || {}).join(', ')}`);
    });

    // Example 2: Search for supply chain vulnerabilities in technology sector
    console.log('\nSearching for supply chain vulnerabilities...');
    const supplyChainFilter: SearchFilter = {
      category: ['supply-chain'],
      industry: ['technology', 'software'],
    };

    const supplyChainResults = await sdk.searchProducts(supplyChainFilter);
    console.log(`Found ${supplyChainResults.data.items.length} supply chain vulnerabilities`);
    supplyChainResults.data.items.forEach(item => {
      console.log(`- ${item.title}`);
      console.log(`  Industry: ${item.industry?.join(', ')}`);
      console.log(`  Region: ${item.region?.join(', ')}`);
    });

    // Example 3: Search with pagination
    console.log('\nDemonstrating pagination...');
    let lastKey = undefined;
    let pageNum = 1;

    do {
      const paginatedFilter: SearchFilter = {
        category: ['web'],
        tags: ['critical'],
        LastEvaluatedKey: lastKey
      };

      const pageResults = await sdk.searchProducts(paginatedFilter);
      console.log(`\nPage ${pageNum}:`);
      pageResults.data.items.forEach(item => {
        console.log(`- ${item.title}`);
      });

      lastKey = pageResults.data.lastEvaluatedKey;
      pageNum++;

      // Limit to 3 pages for this example
      if (pageNum > 3) break;
    } while (lastKey);

    // Example 4: Search by multiple criteria
    console.log('\nSearching with multiple criteria...');
    const complexFilter: SearchFilter = {
      startdate: '2024-01-01',
      enddate: '2024-03-15',
      category: ['malware', 'web'],
      industry: ['healthcare'],
      region: ['north-america'],
      tags: ['critical'],
      indicators: {
        ip: ['192.168.1.100']
      }
    };

    const complexResults = await sdk.searchProducts(complexFilter);
    console.log(`Found ${complexResults.data.items.length} matching items`);
    complexResults.data.items.forEach(item => {
      console.log(`- ${item.title}`);
      console.log(`  Category: ${item.category}`);
      console.log(`  Type: ${item.type}`);
      console.log(`  Tags: ${item.tags?.join(', ')}`);
    });

  } catch (error: any) {
    console.error('Failed to search security data:', error.message);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  searchSecurityData().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
} 