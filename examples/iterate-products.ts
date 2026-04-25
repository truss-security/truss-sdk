import { type SearchProductResponse } from '../src/index';
import { createExampleClient, isJsonOutput, printProducts, runExample } from './_shared';

await runExample(async () => {
  const products: SearchProductResponse[] = [];

  for await (const product of createExampleClient().search.iterProducts(
    {
      days: 7,
      limit: 100,
      order_by: 'pub_date',
      order_direction: 'desc',
    },
    { maxPages: 5 }
  )) {
    products.push(product);
  }

  if (isJsonOutput()) {
    console.log(JSON.stringify(products, null, 2));
    return;
  }

  console.log('Iterated products from the last 7 days');
  printProducts(products);
});
