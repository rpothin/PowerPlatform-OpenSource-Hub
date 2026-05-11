import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { compareRepositoryOutputs, formatComparisonSummary, writeComparisonReport } from "../src/comparison.js";

const packageRoot = process.cwd();
const fixtureRoot = path.join(packageRoot, "tests", "fixtures", "comparison");
const outputRoot = path.join(packageRoot, ".test-output", "comparison");

describe("compareRepositoryOutputs", () => {
  beforeEach(async () => {
    await rm(outputRoot, { recursive: true, force: true });
    await mkdir(outputRoot, { recursive: true });
  });

  it("passes when only volatile and ignored fields differ", async () => {
    const report = await compareRepositoryOutputs({
      baselinePath: path.join(fixtureRoot, "baseline.json"),
      candidatePath: path.join(fixtureRoot, "candidate.json"),
      sentinelsPath: path.join(fixtureRoot, "sentinels.json"),
      generatedAt: "2026-01-03T00:00:00Z"
    });

    expect(report.status).toBe("passed");
    expect(report.summary.stableDifferences).toBe(0);
    expect(report.summary.volatileDifferences).toBeGreaterThan(0);
    expect(report.summary.ignoredDifferences).toBe(2);
    expect(report.failures.missingRepositories).toEqual([]);
    expect(report.failures.missingSentinels.candidate).toEqual([]);
    expect(report.differences.volatile.items.map((difference) => difference.path)).toContain("stargazerCount");
    expect(report.differences.ignored.items.map((difference) => difference.path)).toContain("_workflowRunId");
  });

  it("reports membership, sentinel, count, and stable field failures by fullName", async () => {
    const baselinePath = path.join(outputRoot, "baseline-failures.json");
    const candidatePath = path.join(outputRoot, "candidate-failures.json");
    const sentinelsPath = path.join(outputRoot, "sentinels-failures.json");

    await writeFile(
      baselinePath,
      JSON.stringify([
        { fullName: "contoso/alpha", description: "Baseline", stargazerCount: 1, watchers: { totalCount: 1 } },
        { fullName: "contoso/missing", description: "Missing" },
        { fullName: "contoso/sentinel", description: "Sentinel" }
      ]),
      "utf8"
    );
    await writeFile(
      candidatePath,
      JSON.stringify([
        { fullName: "contoso/alpha", description: "Candidate", stargazerCount: 2, watchers: { totalCount: 2 } },
        { fullName: "contoso/extra", description: "Extra" }
      ]),
      "utf8"
    );
    await writeFile(
      sentinelsPath,
      JSON.stringify({ repositories: [{ fullName: "contoso/alpha" }, { fullName: "contoso/sentinel" }] }),
      "utf8"
    );

    const report = await compareRepositoryOutputs({ baselinePath, candidatePath, sentinelsPath, generatedAt: "2026-01-03T00:00:00Z" });

    expect(report.status).toBe("failed");
    expect(report.failures.missingRepositories).toEqual(["contoso/missing", "contoso/sentinel"]);
    expect(report.failures.extraRepositories).toEqual(["contoso/extra"]);
    expect(report.failures.missingSentinels.candidate).toEqual(["contoso/sentinel"]);
    expect(report.failures.repositoryCountDelta).toMatchObject({ exceeded: true, threshold: 0.15 });
    expect(report.differences.stable.items).toEqual([
      expect.objectContaining({ fullName: "contoso/alpha", path: "description", classification: "stable" })
    ]);
    expect(report.differences.volatile.items.map((difference) => difference.path)).toEqual(["stargazerCount", "watchers.totalCount"]);
  });

  it("fails invalid/non-array JSON inputs and duplicate fullName values", async () => {
    const baselinePath = path.join(outputRoot, "baseline-invalid.json");
    const candidatePath = path.join(outputRoot, "candidate-invalid.json");
    const sentinelsPath = path.join(outputRoot, "sentinels.json");

    await writeFile(baselinePath, JSON.stringify({ fullName: "contoso/not-array" }), "utf8");
    await writeFile(candidatePath, JSON.stringify([{ fullName: "contoso/dup" }, { fullName: "contoso/dup" }]), "utf8");
    await writeFile(sentinelsPath, JSON.stringify({ repositories: [{ fullName: "contoso/dup" }] }), "utf8");

    const report = await compareRepositoryOutputs({ baselinePath, candidatePath, sentinelsPath });

    expect(report.status).toBe("failed");
    expect(report.failures.invalidInputs).toEqual([
      expect.objectContaining({ input: "baseline", reason: "Expected top-level JSON array." })
    ]);
    expect(report.failures.duplicateFullNames).toEqual([
      { input: "candidate", fullName: "contoso/dup", indexes: [0, 1] }
    ]);
  });

  it("writes JSON reports and markdown-ish summaries", async () => {
    const reportPath = path.join(outputRoot, "report.json");
    const report = await compareRepositoryOutputs({
      baselinePath: path.join(fixtureRoot, "baseline.json"),
      candidatePath: path.join(fixtureRoot, "candidate.json"),
      sentinelsPath: path.join(fixtureRoot, "sentinels.json"),
      generatedAt: "2026-01-03T00:00:00Z"
    });

    await writeComparisonReport(report, reportPath);

    const persisted = JSON.parse(await readFile(reportPath, "utf8")) as { status: string };
    expect(persisted.status).toBe("passed");
    expect(formatComparisonSummary(report, reportPath)).toContain("Output parity comparison: passed");
  });
});
