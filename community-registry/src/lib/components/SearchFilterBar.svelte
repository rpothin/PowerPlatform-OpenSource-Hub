<script lang="ts">
	import type { FocusFilter } from '$lib/types';

	interface Props {
		searchQuery: string;
		languageFilter: string;
		focusFilter: FocusFilter;
		languages: string[];
		onSearchChange: (value: string) => void;
		onLanguageChange: (value: string) => void;
		onFocusChange: (value: FocusFilter) => void;
	}

	let {
		searchQuery,
		languageFilter,
		focusFilter,
		languages,
		onSearchChange,
		onLanguageChange,
		onFocusChange
	}: Props = $props();
</script>

<div class="flex flex-col sm:flex-row gap-3 w-full">
	<!-- Search input -->
	<div class="form-control flex-1">
		<label class="input input-bordered flex items-center gap-2 w-full">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<circle cx="11" cy="11" r="8" />
				<path stroke-linecap="round" d="m21 21-4.35-4.35" />
			</svg>
			<input
				type="text"
				class="grow"
				placeholder="Search repositories..."
				value={searchQuery}
				oninput={(e) => onSearchChange(e.currentTarget.value)}
			/>
		</label>
	</div>

	<!-- Language filter -->
	<select
		class="select select-bordered w-full sm:w-48"
		value={languageFilter}
		onchange={(e) => onLanguageChange(e.currentTarget.value)}
	>
		<option value="">All Languages</option>
		{#each languages as lang}
			<option value={lang}>{lang}</option>
		{/each}
	</select>

	<!-- Focus filter -->
	<select
		class="select select-bordered w-full sm:w-52"
		value={focusFilter}
		onchange={(e) => onFocusChange(e.currentTarget.value as FocusFilter)}
	>
		<option value="all">All Focus Areas</option>
		<option value="copilot-studio">Copilot Studio</option>
		<option value="power-apps">Power Apps</option>
		<option value="power-automate">Power Automate</option>
		<option value="dataverse">Dataverse</option>
	</select>
</div>
