export interface Repository {
	name: string;
	fullName: string;
	description: string;
	url: string;
	homepage: string;
	language: string;
	languages: string[];
	license: string;
	stars: number;
	forks: number;
	openIssues: number;
	topics: string[];
	owner: { login: string; type: string };
	isArchived: boolean;
	hasGoodFirstIssues: boolean;
	hasHelpWantedIssues: boolean;
	latestRelease: { name: string; tagName: string; publishedAt: string } | null;
	createdAt: string;
	updatedAt: string;
}

export type FocusFilter = 'all' | 'copilot-studio' | 'power-apps' | 'power-automate' | 'dataverse';

export const focusTopicMap: Record<Exclude<FocusFilter, 'all'>, string[]> = {
	'copilot-studio': ['powervirtualagent', 'copilot-studio', 'copilot', 'chatbot', 'bot'],
	'power-apps': ['powerapps', 'power-apps', 'canvas-app', 'model-driven-app', 'pcf-controls'],
	'power-automate': ['powerautomate', 'power-automate', 'flow', 'rpa'],
	dataverse: ['dataverse', 'cds', 'common-data-service', 'dynamics365']
};
