import { filter } from '../src/index';
import { createExampleClient, isJsonOutput, printProducts, runExample } from './_shared';

await runExample(async () => {
  const productFilter = filter.and(
    filter.eq('category', 'Phishing'),
    filter.anyOf('region', ['North America', 'Europe'])
  );

  const results = await createExampleClient().search.products({
    filter: productFilter,
    days: 30,
    limit: 25,
  });

  if (isJsonOutput()) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  console.log(`Typed filter search: ${filter.expression(productFilter)}`);
  printProducts(results.products, results.total);
});
