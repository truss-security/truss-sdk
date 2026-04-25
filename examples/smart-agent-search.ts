import { createExampleClient, isJsonOutput, printProducts, runExample } from './_shared';

await runExample(async () => {
  const prompt = 'Summarize recent ransomware threats affecting healthcare organizations';
  const jsonOutput = isJsonOutput();

  if (!jsonOutput) {
    console.log('Smart agent search');
    console.log(`Prompt: ${prompt}\n`);
  }

  const response = await createExampleClient('truss-agent-example/1.0').search.smart({
    query: prompt,
    limit: 10,
    generate_response: true,
    max_results_for_response: 5,
  });

  if (jsonOutput) {
    console.log(JSON.stringify(response, null, 2));
    return;
  }

  console.log('Parsed filters:', JSON.stringify(response.parsed_filters ?? {}, null, 2));
  printProducts(response.products, response.total);
  if (response.ai_response?.answer) {
    console.log('\nAI response:');
    console.log(
      typeof response.ai_response.answer === 'string'
        ? response.ai_response.answer
        : response.ai_response.answer.summary
    );
  }
});
