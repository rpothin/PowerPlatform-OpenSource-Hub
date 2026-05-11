export { loadSearchCriteria } from "./config.js";
export { compareRepositoryOutputs, formatComparisonSummary, writeComparisonReport } from "./comparison.js";
export { generateRepositoryDetails } from "./generator.js";
export { createGitHubClient } from "./githubClient.js";
export { normalizeRepositoryRecord, serializeRecords } from "./normalization.js";
export { DryRunProvider, OctokitRepositoryProvider } from "./providers.js";
export type { ComparisonReport, DifferenceClassification, FieldDifference } from "./comparison.js";
export type { CandidateProvider, GenerateResult, PipelineMetrics, RepositoryDetails, RepositoryRecord, SearchCriterion, SearchRepository } from "./types.js";
