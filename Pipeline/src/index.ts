export { loadSearchCriteria } from "./config.js";
export { compareRepositoryOutputs, formatComparisonSummary, writeComparisonReport } from "./comparison.js";
export { generateRepositoryDetails } from "./generator.js";
export { generatedRepositoryRelativePath, planGeneratedRepositoryFiles, writeGeneratedRepositoryFilesAtomically } from "./generatedFiles.js";
export { createGitHubClient } from "./githubClient.js";
export { normalizeRepositoryRecord, serializeRecords } from "./normalization.js";
export { DryRunProvider, OctokitRepositoryProvider } from "./providers.js";
export type { ComparisonReport, DifferenceClassification, FieldDifference } from "./comparison.js";
export type {
  CandidateProvider,
  ComputedRepositoryHealth,
  CuratedRepositoryHealth,
  CuratedRepositoryOverlay,
  GenerateResult,
  GeneratedRepositoryRecord,
  MergedRepositoryRecord,
  PipelineMetrics,
  RepositoryAudience,
  RepositoryCategory,
  RepositoryDetails,
  RepositoryFocusArea,
  RepositoryHealth,
  RepositoryId,
  RepositoryRecord,
  SearchCriterion,
  SearchRepository
} from "./types.js";
