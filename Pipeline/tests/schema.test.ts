import { readFileSync } from "node:fs";
import path from "node:path";

import { Ajv2020, type AnySchema } from "ajv/dist/2020.js";

const packageRoot = process.cwd();
const repositoryRoot = path.resolve(packageRoot, "..");
const schemaRoot = path.join(repositoryRoot, "Configuration", "Schemas");

function compileSchema(schemaName: string) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  ajv.addSchema(loadSchema("GitHubRepositoryDefinitions.schema.json"));
  return ajv.compile(loadSchema(schemaName));
}

function loadSchema(schemaName: string): AnySchema {
  return JSON.parse(readFileSync(path.join(schemaRoot, schemaName), "utf8")) as AnySchema;
}

function generatedRecord(): Record<string, unknown> {
  return {
    createdAt: "2024-01-01T00:00:00Z",
    description: "Sample repository",
    fullName: "owner/repo",
    repositoryId: 123,
    hasIssues: true,
    homepage: "",
    isArchived: false,
    language: "TypeScript",
    license: { key: "mit", name: "MIT License", url: "https://api.github.com/licenses/mit" },
    name: "repo",
    openIssuesCount: 1,
    owner: { id: "1", is_bot: false, login: "owner", type: "Organization", url: "https://github.com/owner" },
    updatedAt: "2026-01-01T00:00:00Z",
    url: "https://github.com/owner/repo",
    codeOfConduct: null,
    forkCount: 1,
    fundingLinks: [],
    isSecurityPolicyEnabled: false,
    isTemplate: false,
    latestRelease: null,
    primaryLanguage: { name: "TypeScript" },
    securityPolicyUrl: null,
    stargazerCount: 10,
    watchers: { totalCount: 2 },
    topics: ["powerplatform"],
    languages: ["TypeScript"],
    openedGoodFirstIssues: 1,
    hasGoodFirstIssues: true,
    openedHelpWantedIssues: 0,
    hasHelpWantedIssues: false,
    openedToContributionsIssues: 1,
    popularityScore: 12,
    health: {
      computed: {
        activityStatus: "active",
        hasRecentRelease: false,
        hasContributionSignals: true,
        hasTrustSignals: false
      }
    },
    _schemaVersion: "1.0.0",
    _generatedAt: "2026-01-01T00:00:00.000Z",
    _workflowRunId: "local"
  };
}

describe("repository schemas", () => {
  it("validates the current merged frontend artifact", () => {
    const validate = compileSchema("GitHubRepositoriesDetails.schema.json");
    const data = JSON.parse(readFileSync(path.join(repositoryRoot, "Data", "GitHubRepositoriesDetails.json"), "utf8")) as unknown;

    expect(validate(data)).toBe(true);
  });

  it("validates a generated repository record with stable identity and computed health", () => {
    const validate = compileSchema("GitHubRepositoryGenerated.schema.json");
    const withoutRepositoryId = generatedRecord();
    delete withoutRepositoryId.repositoryId;

    expect(validate(generatedRecord())).toBe(true);
    expect(validate(withoutRepositoryId)).toBe(false);
  });

  it("allows curated overlay fields and rejects generated-field overrides", () => {
    const validate = compileSchema("GitHubRepositoryOverlay.schema.json");
    const overlay = {
      repositoryId: 123,
      fullName: "owner/repo",
      curationStatus: "reviewed",
      category: "power-apps",
      focusAreas: ["canvas-apps"],
      audiences: ["makers"],
      featured: true,
      customDescription: "Curated summary",
      health: {
        curated: {
          maturity: "stable",
          maintenance: "maintained",
          reviewedAt: "2026-01-01",
          reviewedBy: "maintainer"
        }
      }
    };

    expect(validate(overlay)).toBe(true);
    expect(validate({ ...overlay, stargazerCount: 10 })).toBe(false);
  });
});
