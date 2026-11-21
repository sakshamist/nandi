import { ingestKnowledge } from "../src/lib/ai/ingestion.ts";

function parseArgs(argv: string[]): { docsDir?: string; dryRun: boolean; limit?: number } {
  const options: { docsDir?: string; dryRun: boolean; limit?: number } = { dryRun: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--dir") {
      options.docsDir = argv[index + 1];
      index += 1;
    } else if (arg === "--limit") {
      const value = Number(argv[index + 1]);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error("--limit must be a positive number");
      }
      options.limit = value;
      index += 1;
    }
  }

  return options;
}

async function main(): Promise<void> {
  const result = await ingestKnowledge(parseArgs(process.argv.slice(2)));
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
