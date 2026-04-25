import { createExampleClient, isJsonOutput, runExample } from './_shared';

await runExample(async () => {
  const results = await createExampleClient().search.productsStix({
    filterExpression: "category = 'Malware'",
    days: 7,
    limit: 25,
  });

  if (isJsonOutput()) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  console.log('STIX export');
  console.log(`Objects: ${results.bundle.objects.length}`);
  if (results.pagination) {
    console.log('Pagination:', results.pagination);
  }
});
