import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TrussClient, type SearchProductResponse } from '../src/index';

export function createExampleClient(userAgent = 'truss-api-sdk-example/1.0'): TrussClient {
  loadDotEnv();

  return new TrussClient({
    baseUrl: process.env.TRUSS_API_URL ?? 'https://api.truss-security.com',
    apiKey: process.env.TRUSS_API_KEY,
    userAgent,
  });
}

export function isJsonOutput(): boolean {
  return process.argv.includes('--json');
}

export function printProducts(products: SearchProductResponse[], total?: number): void {
  const countLabel = total === undefined ? `${products.length}` : `${products.length} of ${total}`;
  console.log(`Products: showing ${countLabel}\n`);

  for (const [index, product] of products.entries()) {
    const source = product.source ? ` | ${product.source}` : '';
    const category = product.category ? ` | ${product.category}` : '';
    console.log(`${index + 1}. ${product.title ?? '(untitled)'}${source}${category}`);
  }
}

export async function runExample(run: () => Promise<void>): Promise<void> {
  try {
    await run();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
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
