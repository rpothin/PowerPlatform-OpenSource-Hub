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

type CliOptions = GenerateCliOptions | CompareCliOptions;

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

    const provider = options.live ? new OctokitRepositoryProvider(createGitHubClient(requiredToken(env))) : new DryRunProvider();
    const result = await generateRepositoryDetails({
      configPath: options.configPath,
      outputPath: options.outputPath,
      schemaPath: options.schemaPath,
      provider,
      concurrency: options.concurrency,
      ...(options.metricsPath === undefined ? {} : { metricsPath: options.metricsPath })
    });

    stdout(
      JSON.stringify(
        {
          mode: options.live ? "live" : "dry-run",
          outputPath: options.outputPath,
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

  return {
    command: "generate",
    configPath,
    outputPath,
    schemaPath,
    live,
    concurrency,
    ...(metricsPath === undefined ? {} : { metricsPath })
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

function defaultSentinelsPath(): string {
  return path.join(repositoryRoot, "Configuration", "SentinelRepositories.json");
}

function helpText(): string {
  return `Usage:
  node dist/cli.js generate [--dry-run|--live] --output <file> [options]
  node dist/cli.js compare --baseline <file> --candidate <file> --report <file> [options]

Generate options:
  --config <file>       Search criteria JSON. Defaults to repository Configuration.
  --schema <file>       Output schema JSON. Defaults to repository schema.
  --output <file>       Output JSON path. Defaults to Pipeline Output.
  --metrics <file>      Optional metrics JSON path.
  --concurrency <n>     Repository detail concurrency. Defaults to 4.
  --dry-run             Generate deterministic no-network data (default).
  --live                Use Octokit REST APIs with GITHUB_TOKEN.

Compare options:
  --baseline <file>             Baseline JSON array, usually PowerShell output.
  --candidate <file>            Candidate JSON array, such as TypeScript or Rust output.
  --sentinels <file>            Sentinel repository config. Defaults to repository Configuration.
  --report <file>               JSON comparison report path.
  --count-delta-threshold <n>   Allowed repository-count delta ratio. Defaults to 0.15.
`;
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === cliFilePath) {
  const exitCode = await runCli(process.argv.slice(2));
  process.exitCode = exitCode;
}
