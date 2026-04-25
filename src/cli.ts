#!/usr/bin/env node
import { password, select } from '@inquirer/prompts';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TrussClient, filter } from './index.js';
import type { SearchProductResponse, TrussClientConfig } from './types/index.js';

type ExampleName = 'basic' | 'typed-filter' | 'iterate' | 'smart' | 'stix';

const EXAMPLES: Record<ExampleName, { title: string; description: string; run: (json: boolean) => Promise<void> }> = {
  basic: {
    title: 'Basic product search',
    description: 'Search recent malware products and print a compact summary.',
    run: runBasicExample,
  },
  'typed-filter': {
    title: 'Typed filter search',
    description: 'Build a FilterQL search with the typed filter helper.',
    run: runTypedFilterExample,
  },
  iterate: {
    title: 'Iterate products',
    description: 'Stream paginated products with an async iterator.',
    run: runIterateExample,
  },
  smart: {
    title: 'Smart agent search',
    description: 'Use natural-language search with an agent-friendly response.',
    run: runSmartExample,
  },
  stix: {
    title: 'STIX export',
    description: 'Fetch matching products as a STIX bundle.',
    run: runStixExample,
  },
};

async function main(): Promise<void> {
  loadDotEnv();

  const [command, exampleName, ...flags] = process.argv.slice(2);
  const json = flags.includes('--json') || exampleName === '--json';
  const listOnly = flags.includes('--list') || exampleName === '--list';

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command !== 'examples') {
    throw new Error(`Unknown command: ${command}`);
  }

  if (!exampleName || exampleName === '--json' || exampleName === '--list') {
    if (!listOnly && canPrompt()) {
      const selectedExample = await selectExample();
      await runExampleWithAuth(selectedExample, json);
      return;
    }

    printExamples();
    return;
  }

  if (!isExampleName(exampleName)) {
    throw new Error(`Unknown example: ${exampleName}`);
  }

  await runExampleWithAuth(exampleName, json);
}

function createClient(): TrussClient {
  const config: TrussClientConfig = {
    baseUrl: process.env.TRUSS_API_URL ?? 'https://api.truss-security.com',
    userAgent: process.env.TRUSS_SDK_USER_AGENT ?? 'truss-api-sdk-cli/1.0',
  };

  if (process.env.TRUSS_API_KEY) {
    config.apiKey = process.env.TRUSS_API_KEY;
  }

  return new TrussClient(config);
}

function loadDotEnv(): void {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    process.env[key] ??= value;
  }
}

function printHelp(): void {
  console.log(`Truss API SDK

Usage:
  truss examples
  truss examples --list
  truss examples <name>
  truss examples <name> --json

Examples:
  truss examples basic
  truss examples typed-filter
  truss examples iterate
  truss examples smart
  truss examples stix
`);
}

function printExamples(): void {
  console.log('Available examples:\n');
  for (const [name, example] of Object.entries(EXAMPLES)) {
    console.log(`  ${name.padEnd(12)} ${example.title}`);
    console.log(`               ${example.description}`);
  }
  console.log('\nRun one with: truss examples basic');
}

async function selectExample(): Promise<ExampleName> {
  return select<ExampleName>({
    message: 'Choose a Truss API example',
    choices: Object.entries(EXAMPLES).map(([name, example]) => ({
      name: example.title,
      value: name as ExampleName,
      description: example.description,
    })),
  });
}

function canPrompt(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY && !process.env.CI);
}

async function runExampleWithAuth(exampleName: ExampleName, json: boolean): Promise<void> {
  await ensureApiKey();
  await EXAMPLES[exampleName].run(json);
}

async function ensureApiKey(): Promise<void> {
  if (process.env.TRUSS_API_KEY) return;

  if (!canPrompt()) {
    throw new Error(
      'TRUSS_API_KEY is required. Set TRUSS_API_KEY in your environment or .env file.'
    );
  }

  const apiKey = await password({
    message: 'Enter your Truss API key',
    mask: '*',
    validate: (value) => (value.trim() ? true : 'API key is required'),
  });

  process.env.TRUSS_API_KEY = apiKey.trim();
}

function printProducts(products: SearchProductResponse[], total?: number): void {
  const countLabel = total === undefined ? `${products.length}` : `${products.length} of ${total}`;
  console.log(`Products: showing ${countLabel}\n`);

  for (const [index, product] of products.entries()) {
    const source = product.source ? ` | ${product.source}` : '';
    const category = product.category ? ` | ${product.category}` : '';
    console.log(`${index + 1}. ${product.title ?? '(untitled)'}${source}${category}`);
  }
}

async function runBasicExample(json: boolean): Promise<void> {
  const result = await createClient().search.products({
    filterExpression: "category = 'Malware'",
    days: 7,
    limit: 10,
  });

  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('Basic product search');
  printProducts(result.products, result.total);
}

async function runTypedFilterExample(json: boolean): Promise<void> {
  const productFilter = filter.and(
    filter.eq('category', 'Phishing'),
    filter.anyOf('region', ['North America', 'Europe'])
  );

  const result = await createClient().search.products({
    filter: productFilter,
    days: 30,
    limit: 25,
  });

  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Typed filter search: ${filter.expression(productFilter)}\n`);
  printProducts(result.products, result.total);
}

async function runIterateExample(json: boolean): Promise<void> {
  const products: SearchProductResponse[] = [];

  for await (const product of createClient().search.iterProducts(
    {
      days: 7,
      limit: 100,
      order_by: 'pub_date',
      order_direction: 'desc',
    },
    { maxPages: 2 }
  )) {
    products.push(product);
  }

  if (json) {
    console.log(JSON.stringify(products, null, 2));
    return;
  }

  console.log('Iterated products from the last 7 days');
  printProducts(products);
}

async function runSmartExample(json: boolean): Promise<void> {
  const prompt = 'Summarize recent ransomware threats affecting healthcare organizations';

  if (!json) {
    console.log('Smart agent search');
    console.log(`Prompt: ${prompt}\n`);
  }

  const result = await createClient().search.smart({
    query: prompt,
    limit: 10,
    generate_response: true,
    max_results_for_response: 5,
  });

  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('Parsed filters:', JSON.stringify(result.parsed_filters ?? {}, null, 2));
  printProducts(result.products, result.total);
  if (result.ai_response?.answer) {
    console.log('\nAI response:');
    console.log(typeof result.ai_response.answer === 'string' ? result.ai_response.answer : result.ai_response.answer.summary);
  }
}

async function runStixExample(json: boolean): Promise<void> {
  const result = await createClient().search.productsStix({
    filterExpression: "category = 'Malware'",
    days: 7,
    limit: 25,
  });

  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('STIX export');
  console.log(`Objects: ${result.bundle.objects.length}`);
  if (result.pagination) {
    console.log('Pagination:', result.pagination);
  }
}

function isExampleName(name: string): name is ExampleName {
  return name in EXAMPLES;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
