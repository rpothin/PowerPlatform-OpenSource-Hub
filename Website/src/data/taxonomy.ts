import type {
  RepositoryAudience,
  RepositoryCategory,
  RepositoryFocusArea,
} from '../types/repository';

export type TaxonomyEntry<TValue extends string = string> = {
  readonly value: TValue;
  readonly label: string;
  readonly description?: string;
};

export const categories = [
  {
    value: 'copilot-studio',
    label: 'Copilot Studio',
    description: 'Copilot Studio projects for building, extending, and operating copilots and conversational agents.',
  },
  {
    value: 'power-apps',
    label: 'Power Apps',
    description: 'Power Apps repositories for canvas apps, model-driven apps, component framework controls, and maker productivity.',
  },
  {
    value: 'power-automate',
    label: 'Power Automate',
    description: 'Power Automate projects for cloud flows, desktop automation, workflow orchestration, and process automation.',
  },
  {
    value: 'power-pages',
    label: 'Power Pages',
    description: 'Power Pages repositories for website experiences, portals, templates, and site implementation assets.',
  },
  {
    value: 'dataverse',
    label: 'Dataverse',
    description: 'Dataverse projects for data modeling, APIs, integrations, plugins, and platform extensibility.',
  },
  {
    value: 'power-bi',
    label: 'Power BI',
    description: 'Power BI repositories for reports, visuals, semantic models, analytics, and data visualization tooling.',
  },
  {
    value: 'connectors',
    label: 'Connectors',
    description: 'Connector projects that integrate Power Platform with services, APIs, and custom business systems.',
  },
  {
    value: 'alm-devops',
    label: 'ALM and DevOps',
    description: 'Application lifecycle management and DevOps repositories for automation, deployment, testing, and release practices.',
  },
  {
    value: 'governance-admin',
    label: 'Governance and Admin',
    description: 'Governance and administration projects for tenant management, environment operations, security, and compliance.',
  },
  {
    value: 'developer-tooling',
    label: 'Developer Tooling',
    description: 'Developer tooling repositories for CLIs, SDKs, extensions, helpers, and automation used by makers and developers.',
  },
  {
    value: 'samples-templates',
    label: 'Samples and Templates',
    description: 'Sample applications, templates, starter kits, and reference implementations for Power Platform scenarios.',
  },
  {
    value: 'learning-docs',
    label: 'Learning and Docs',
    description: 'Learning resources, documentation, workshops, and guidance for Power Platform open-source contributors.',
  },
] as const satisfies readonly TaxonomyEntry<RepositoryCategory>[];

export const focusAreas = [
  { value: 'agent-development', label: 'Agent Development' },
  { value: 'bot-building', label: 'Bot Building' },
  { value: 'custom-connectors', label: 'Custom Connectors' },
  { value: 'pcf-controls', label: 'PCF Controls' },
  { value: 'canvas-apps', label: 'Canvas Apps' },
  { value: 'model-driven-apps', label: 'Model-driven Apps' },
  { value: 'cloud-flows', label: 'Cloud Flows' },
  { value: 'desktop-flows', label: 'Desktop Flows' },
  { value: 'power-pages-sites', label: 'Power Pages Sites' },
  { value: 'dataverse-modeling', label: 'Dataverse Modeling' },
  { value: 'environment-governance', label: 'Environment Governance' },
  { value: 'solution-lifecycle', label: 'Solution Lifecycle' },
  { value: 'testing-quality', label: 'Testing and Quality' },
  { value: 'community-samples', label: 'Community Samples' },
] as const satisfies readonly TaxonomyEntry<RepositoryFocusArea>[];

export const audiences = [
  { value: 'users', label: 'Users' },
  { value: 'contributors', label: 'Contributors' },
  { value: 'maintainers', label: 'Maintainers' },
  { value: 'makers', label: 'Makers' },
  { value: 'developers', label: 'Developers' },
  { value: 'admins', label: 'Admins' },
] as const satisfies readonly TaxonomyEntry<RepositoryAudience>[];

export const taxonomyEntries: readonly TaxonomyEntry[] = [
  ...categories,
  ...focusAreas,
  ...audiences,
];

const taxonomyLabelsByValue = new Map<string, string>(
  taxonomyEntries.map((entry): [string, string] => [entry.value, entry.label]),
);

const taxonomyDescriptionsByValue = new Map<string, string>(
  taxonomyEntries
    .filter((entry): entry is TaxonomyEntry & { readonly description: string } => !!entry.description)
    .map((entry): [string, string] => [entry.value, entry.description]),
);

export function getTaxonomyLabel(value: string): string | undefined {
  return taxonomyLabelsByValue.get(value);
}

export function getTaxonomyDescription(value: string): string | undefined {
  return taxonomyDescriptionsByValue.get(value);
}

export function getCategoryTaxonomy(value: RepositoryCategory): TaxonomyEntry<RepositoryCategory> {
  return categories.find((entry) => entry.value === value) ?? { value, label: value };
}
