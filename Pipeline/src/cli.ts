import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_REPOSITORY_COUNT_DELTA_THRESHOLD,
  compareRepositoryOutputs,
  formatComparisonSummary,
  writeComparisonReport
} from "./comparison.js";
import { generateRepositoryDetails } from "./generator.js";
import { createGitHubClient } from "./githubClient.js";
import { mergeRepositoryDetails } from "./merge.js";
import { DryRunProvider, OctokitRepositoryProvider } from "./providers.js";

interface CliIO {
  stdout?: (message: string) => void;
  stderr?: (message: string) => void;
}

interface GenerateCliOptions {
  command: "generate";
  configPath: string;
  outputPath: string;
  schemaPath: string;
  generatedDirPath?: string;
  generatedSchemaPath?: string;
  metricsPath?: string;
  live: boolean;
  concurrency: number;
}

interface CompareCliOptions {
  command: "compare";
  baselinePath: string;
  candidatePath: string;
  sentinelsPath: string;
  reportPath: string;
  repositoryCountDeltaThreshold: number;
}

interface MergeCliOptions {
  command: "merge";
  generatedDirPath: string;
  overlayDirPath: string;
  outputPath: string;
  schemaPath: string;
  taxonomyDirPath: string;
  sentinelsPath: string;
  generatedSchemaPath?: string;
  overlaySchemaPath?: string;
}

type CliOptions = GenerateCliOptions | CompareCliOptions | MergeCliOptions;

const cliFilePath = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(cliFilePath), "..");
const repositoryRoot = path.resolve(packageRoot, "..");

export async function runCli(args: string[], env: NodeJS.ProcessEnv = process.env, io: CliIO = {}): Promise<number> {
  const stdout = io.stdout ?? console.log;
  const stderr = io.stderr ?? console.error;

  try {
    if (args.includes("--help") || args.includes("-h")) {
      stdout(helpText());
      return 0;
    }

    const options = parseArgs(args);
    if (options.command === "compare") {
      const report = await compareRepositoryOutputs({
        baselinePath: options.baselinePath,
        candidatePath: options.candidatePath,
        sentinelsPath: options.sentinelsPath,
        reportPath: options.reportPath,
        repositoryCountDeltaThreshold: options.repositoryCountDeltaThreshold
      });
      await writeComparisonReport(report, options.reportPath);
      stdout(formatComparisonSummary(report, options.reportPath));
      return report.status === "passed" ? 0 : 1;
    }

    if (options.command === "merge") {
      const result = await mergeRepositoryDetails({
        generatedDirPath: options.generatedDirPath,
        overlayDirPath: options.overlayDirPath,
        outputPath: options.outputPath,
        schemaPath: options.schemaPath,
        taxonomyDirPath: options.taxonomyDirPath,
        sentinelsPath: options.sentinelsPath,
        ...(options.generatedSchemaPath === undefined ? {} : { generatedSchemaPath: options.generatedSchemaPath }),
        ...(options.overlaySchemaPath === undefined ? {} : { overlaySchemaPath: options.overlaySchemaPath })
      });
      for (const warning of result.metrics.warnings) {
        stderr(`::warning::${warning}`);
      }
      stdout(
        JSON.stringify(
          {
            outputPath: options.outputPath,
            generatedDirPath: options.generatedDirPath,
            overlayDirPath: options.overlayDirPath,
            ...result.metrics
          },
          null,
          2
        )
      );
      return 0;
    }

    const provider = options.live ? new OctokitRepositoryProvider(createGitHubClient(requiredToken(env))) : new DryRunProvider();
    const result = await generateRepositoryDetails({
      configPath: options.configPath,
      outputPath: options.outputPath,
      schemaPath: options.schemaPath,
      provider,
      concurrency: options.concurrency,
      ...(options.generatedDirPath === undefined
        ? {}
        : {
            generatedDirPath: options.generatedDirPath,
            ...(options.generatedSchemaPath === undefined ? {} : { generatedSchemaPath: options.generatedSchemaPath })
          }),
      ...(options.metricsPath === undefined ? {} : { metricsPath: options.metricsPath })
    });

    stdout(
      JSON.stringify(
        {
          mode: options.live ? "live" : "dry-run",
          outputPath: options.outputPath,
          generatedDirPath: options.generatedDirPath ?? null,
          metricsPath: options.metricsPath ?? null,
          generatedRecords: result.metrics.generatedRecords,
          detailFailures: result.metrics.detailFailures,
          warnings: result.metrics.warnings
        },
        null,
        2
      )
    );
    return 0;
  } catch (error) {
    stderr(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function parseArgs(args: string[]): CliOptions {
  if (args[0] === "generate") {
    return parseGenerateArgs(args);
  }

  if (args[0] === "compare") {
    return parseCompareArgs(args);
  }

  if (args[0] === "merge") {
    return parseMergeArgs(args);
  }

  throw new Error(`Unknown command '${args[0] ?? ""}'.\n${helpText()}`);
}

function parseGenerateArgs(args: string[]): GenerateCliOptions {
  if (args[0] !== "generate") {
    throw new Error(`Unknown command '${args[0] ?? ""}'.\n${helpText()}`);
  }

  let live = false;
  let dryRun = false;
  let configPath = defaultConfigPath();
  let outputPath = path.join(packageRoot, "Output", "GitHubRepositoriesDetails.json");
  let schemaPath = defaultSchemaPath();
  let generatedDirPath: string | undefined;
  let generatedSchemaPath: string | undefined;
  let metricsPath: string | undefined;
  let concurrency = 4;

  for (let index = 1; index < args.length; index += 1) {
    const current = args[index];
    switch (current) {
      case "--dry-run":
        dryRun = true;
        break;
      case "--live":
        live = true;
        break;
      case "--config":
        configPath = resolveUserPath(requiredValue(args, (index += 1), current));
        break;
      case "--output":
        outputPath = resolveUserPath(requiredValue(args, (index += 1), current));
        break;
      case "--schema":
        schemaPath = resolveUserPath(requiredValue(args, (index += 1), current));
        break;
      case "--generated-dir":
        generatedDirPath = resolveUserPath(requiredValue(args, (index += 1), current));
        break;
      case "--generated-schema":
        generatedSchemaPath = resolveUserPath(requiredValue(args, (index += 1), current));
        break;
      case "--metrics":
        metricsPath = resolveUserPath(requiredValue(args, (index += 1), current));
        break;
      case "--concurrency": {
        const value = Number.parseInt(requiredValue(args, (index += 1), current), 10);
        if (!Number.isInteger(value) || value < 1) {
          throw new Error("--concurrency must be a positive integer.");
        }
        concurrency = value;
        break;
      }
      default:
        throw new Error(`Unknown option '${current}'.\n${helpText()}`);
    }
  }

  if (live && dryRun) {
    throw new Error("Choose either --live or --dry-run, not both.");
  }
  if (generatedSchemaPath !== undefined && generatedDirPath === undefined) {
    throw new Error("--generated-schema requires --generated-dir.");
  }
  if (generatedDirPath !== undefined && generatedSchemaPath === undefined) {
    generatedSchemaPath = defaultGeneratedSchemaPath();
  }

  return {
    command: "generate",
    configPath,
    outputPath,
    schemaPath,
    ...(generatedDirPath === undefined ? {} : { generatedDirPath }),
    ...(generatedSchemaPath === undefined ? {} : { generatedSchemaPath }),
    live,
    concurrency,
    ...(metricsPath === undefined ? {} : { metricsPath })
  };
}

function parseMergeArgs(args: string[]): MergeCliOptions {
  let generatedDirPath: string | undefined;
  let overlayDirPath: string | undefined;
  let outputPath = path.join(repositoryRoot, "Data", "GitHubRepositoriesDetails.json");
  let schemaPath = defaultSchemaPath();
  let taxonomyDirPath = defaultTaxonomyDirPath();
  let sentinelsPath = defaultSentinelsPath();
  let generatedSchemaPath: string | undefined;
  let overlaySchemaPath: string | undefined;

  for (let index = 1; index < args.length; index += 1) {
    const current = args[index];
    switch (current) {
      case "--generated-dir":
        generatedDirPath = resolveUserPath(requiredValue(args, (index += 1), current));
        break;
      case "--overlay-dir":
        overlayDirPath = resolveUserPath(requiredValue(args, (index += 1), current));
        break;
      case "--schema":
        schemaPath = resolveUserPath(requiredValue(args, (index += 1), current));
        break;
      case "--output":
        outputPath = resolveUserPath(requiredValue(args, (index += 1), current));
        break;
      case "--taxonomy-dir":
        taxonomyDirPath = resolveUserPath(requiredValue(args, (index += 1), current));
        break;
      case "--sentinels":
        sentinelsPath = resolveUserPath(requiredValue(args, (index += 1), current));
        break;
      case "--generated-schema":
        generatedSchemaPath = resolveUserPath(requiredValue(args, (index += 1), current));
        break;
      case "--overlay-schema":
        overlaySchemaPath = resolveUserPath(requiredValue(args, (index += 1), current));
        break;
      default:
        throw new Error(`Unknown option '${current}'.\n${helpText()}`);
    }
  }

  if (generatedDirPath === undefined) {
    throw new Error("merge requires --generated-dir <dir>.");
  }
  if (overlayDirPath === undefined) {
    throw new Error("merge requires --overlay-dir <dir>.");
  }

  return {
    command: "merge",
    generatedDirPath,
    overlayDirPath,
    outputPath,
    schemaPath,
    taxonomyDirPath,
    sentinelsPath,
    ...(generatedSchemaPath === undefined ? {} : { generatedSchemaPath }),
    ...(overlaySchemaPath === undefined ? {} : { overlaySchemaPath })
  };
}

function parseCompareArgs(args: string[]): CompareCliOptions {
  let baselinePath: string | undefined;
  let candidatePath: string | undefined;
  let sentinelsPath = defaultSentinelsPath();
  let reportPath: string | undefined;
  let repositoryCountDeltaThreshold = DEFAULT_REPOSITORY_COUNT_DELTA_THRESHOLD;

  for (let index = 1; index < args.length; index += 1) {
    const current = args[index];
    switch (current) {
      case "--baseline":
        baselinePath = resolveUserPath(requiredValue(args, (index += 1), current));
        break;
      case "--candidate":
        candidatePath = resolveUserPath(requiredValue(args, (index += 1), current));
        break;
      case "--sentinels":
        sentinelsPath = resolveUserPath(requiredValue(args, (index += 1), current));
        break;
      case "--report":
        reportPath = resolveUserPath(requiredValue(args, (index += 1), current));
        break;
      case "--count-delta-threshold": {
        const value = Number.parseFloat(requiredValue(args, (index += 1), current));
        if (!Number.isFinite(value) || value < 0) {
          throw new Error("--count-delta-threshold must be a non-negative number.");
        }
        repositoryCountDeltaThreshold = value;
        break;
      }
      default:
        throw new Error(`Unknown option '${current}'.\n${helpText()}`);
    }
  }

  if (baselinePath === undefined) {
    throw new Error("compare requires --baseline <file>.");
  }
  if (candidatePath === undefined) {
    throw new Error("compare requires --candidate <file>.");
  }
  if (reportPath === undefined) {
    throw new Error("compare requires --report <file>.");
  }

  return {
    command: "compare",
    baselinePath,
    candidatePath,
    sentinelsPath,
    reportPath,
    repositoryCountDeltaThreshold
  };
}

function requiredValue(args: string[], index: number, optionName: string): string {
  const value = args[index];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${optionName} requires a value.`);
  }

  return value;
}

function requiredToken(env: NodeJS.ProcessEnv): string {
  if (env.GITHUB_TOKEN === undefined || env.GITHUB_TOKEN.trim() === "") {
    throw new Error("Live mode requires GITHUB_TOKEN.");
  }

  return env.GITHUB_TOKEN;
}

function resolveUserPath(value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
}

function defaultConfigPath(): string {
  return path.join(repositoryRoot, "Configuration", "GitHubRepositoriesSearchCriteria.json");
}

function defaultSchemaPath(): string {
  return path.join(repositoryRoot, "Configuration", "Schemas", "GitHubRepositoriesDetails.schema.json");
}

function defaultGeneratedSchemaPath(): string {
  return path.join(repositoryRoot, "Configuration", "Schemas", "GitHubRepositoryGenerated.schema.json");
}

function defaultSentinelsPath(): string {
  return path.join(repositoryRoot, "Configuration", "SentinelRepositories.json");
}

function defaultTaxonomyDirPath(): string {
  return path.join(repositoryRoot, "Configuration", "Taxonomy");
}

function helpText(): string {
  return `Usage:
  node dist/cli.js generate [--dry-run|--live] --output <file> [options]
  node dist/cli.js merge --generated-dir <dir> --overlay-dir <dir> [options]
  node dist/cli.js compare --baseline <file> --candidate <file> --report <file> [options]

Generate options:
  --config <file>       Search criteria JSON. Defaults to repository Configuration.
  --schema <file>       Output schema JSON. Defaults to repository schema.
  --output <file>       Output JSON path. Defaults to Pipeline Output.
  --generated-dir <dir> Write per-repository generated JSON files to a replaced directory.
  --generated-schema <file>
                        Per-repository generated record schema. Defaults to repository generated schema.
  --metrics <file>      Optional metrics JSON path.
  --concurrency <n>     Repository detail concurrency. Defaults to 4.
  --dry-run             Generate deterministic no-network data (default).
  --live                Use Octokit REST APIs with GITHUB_TOKEN.

Merge options:
  --generated-dir <dir>         Required per-repository generated JSON directory.
  --overlay-dir <dir>           Required curated overlay JSON directory.
  --schema <file>               Merged output schema. Defaults to repository schema.
  --output <file>               Merged frontend artifact. Defaults to repository Data.
  --taxonomy-dir <dir>          Taxonomy directory. Defaults to repository Configuration.
  --sentinels <file>            Sentinel repository config. Defaults to repository Configuration.
  --generated-schema <file>     Per-repository generated record schema.
  --overlay-schema <file>       Curated overlay schema.

Compare options:
  --baseline <file>             Baseline JSON array, usually PowerShell output.
  --candidate <file>            Candidate JSON array, such as generated TypeScript output.
  --sentinels <file>            Sentinel repository config. Defaults to repository Configuration.
  --report <file>               JSON comparison report path.
  --count-delta-threshold <n>   Allowed repository-count delta ratio. Defaults to 0.15.
`;
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === cliFilePath) {
  const exitCode = await runCli(process.argv.slice(2));
  process.exitCode = exitCode;
}
