import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { runCli } from "../src/cli.js";

const packageRoot = process.cwd();
const repositoryRoot = path.resolve(packageRoot, "..");
const schemaPath = path.join(repositoryRoot, "Configuration", "Schemas", "GitHubRepositoriesDetails.schema.json");
const outputRoot = path.join(packageRoot, ".test-output", "cli");
const comparisonFixtureRoot = path.join(packageRoot, "tests", "fixtures", "comparison");

describe("CLI", () => {
  beforeEach(async () => {
    await rm(outputRoot, { recursive: true, force: true });
    await mkdir(outputRoot, { recursive: true });
  });

  it("generates dry-run output and metrics without a GitHub token", async () => {
    const configPath = path.join(outputRoot, "criteria.json");
    const outputPath = path.join(outputRoot, "details.json");
    const metricsPath = path.join(outputRoot, "metrics.json");
    const stdout: string[] = [];
    await writeFile(configPath, JSON.stringify([{ topic: "powerplatform", searchLimit: 1 }]), "utf8");

    const exitCode = await runCli(
      ["generate", "--dry-run", "--config", configPath, "--schema", schemaPath, "--output", outputPath, "--metrics", metricsPath],
      {},
      { stdout: (message) => stdout.push(message) }
    );

    expect(exitCode).toBe(0);
    expect(JSON.parse(await readFile(outputPath, "utf8"))).toHaveLength(1);
    expect(JSON.parse(await readFile(metricsPath, "utf8"))).toMatchObject({ generatedRecords: 1, detailFailures: 0 });
    expect(stdout.join("\n")).toContain("dry-run");
  });

  it("requires GITHUB_TOKEN for live mode", async () => {
    const stderr: string[] = [];

    const exitCode = await runCli(["generate", "--live", "--output", path.join(outputRoot, "details.json")], {}, { stderr: (message) => stderr.push(message) });

    expect(exitCode).toBe(1);
    expect(stderr.join("\n")).toContain("GITHUB_TOKEN");
  });

  it("compares baseline and candidate outputs without live GitHub calls", async () => {
    const reportPath = path.join(outputRoot, "parity-report.json");
    const stdout: string[] = [];

    const exitCode = await runCli(
      [
        "compare",
        "--baseline",
        path.join(comparisonFixtureRoot, "baseline.json"),
        "--candidate",
        path.join(comparisonFixtureRoot, "candidate.json"),
        "--sentinels",
        path.join(comparisonFixtureRoot, "sentinels.json"),
        "--report",
        reportPath
      ],
      {},
      { stdout: (message) => stdout.push(message) }
    );

    expect(exitCode).toBe(0);
    expect(JSON.parse(await readFile(reportPath, "utf8"))).toMatchObject({ status: "passed" });
    expect(stdout.join("\n")).toContain("Volatile differences");
  });
});
