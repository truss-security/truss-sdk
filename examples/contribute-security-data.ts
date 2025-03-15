import { config } from 'dotenv';
config();
import { TrussSDK, Product } from '../src/index.js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const API_KEY = process.env.TRUSS_API_KEY || 'your-api-key';
const API_URL = process.env.TRUSS_API_URL || 'https://api.truss-security.com';

// Initialize the SDK
const sdk = new TrussSDK({
  apiKey: API_KEY,
  baseUrl: API_URL
});

async function contributeSecurityData() {
  try {
    // Read the sample data file
    const dataPath = path.join(__dirname, 'data', 'sample-security-data.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);

    console.log(`Found ${data.products.length} security products to contribute...`);

    // Process each product
    for (const product of data.products) {
      try {
        console.log(`\nContributing product: ${product.title}`);
        console.log('Category:', product.category);
        console.log('Type:', product.type);
        
        // Count indicators
        const indicatorCount = Object.values(product.indicators)
          .reduce((sum, arr) => sum + arr.length, 0);
        console.log('Number of indicators:', indicatorCount);

        // Submit the product
        const result = await sdk.createProduct(product);
        
        console.log('Successfully contributed product:');
        console.log('- ID:', result.data.id);
        console.log('- Status:', result.statusCode);
        console.log('- Version:', result.data.version);

      } catch (error) {
        console.error(`Failed to contribute product "${product.title}":`, error.message);
        // Continue with next product even if one fails
        continue;
      }
    }

    console.log('\nFinished contributing security data');

  } catch (error) {
    console.error('Failed to process security data:', error.message);
    process.exit(1);
  }
}

// Run the example
contributeSecurityData().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 