<script lang="ts">
	import { onMount } from 'svelte';
	import Fuse from 'fuse.js';
	import type { Repository, FocusFilter } from '$lib/types';
	import { focusTopicMap } from '$lib/types';
	import RepoCard from '$lib/components/RepoCard.svelte';
	import SearchFilterBar from '$lib/components/SearchFilterBar.svelte';
	import ContributeCta from '$lib/components/ContributeCta.svelte';

	let allRepos: Repository[] = $state([]);
	let searchQuery = $state('');
	let languageFilter = $state('');
	let focusFilter: FocusFilter = $state('all');
	let loading = $state(true);
	let theme = $state('power');

	let fuse: Fuse<Repository> | null = $state(null);

	const languages = $derived(
		[...new Set(allRepos.map((r) => r.language).filter(Boolean))].sort()
	);

	const filteredRepos = $derived.by(() => {
		let results = allRepos;

		// Fuse.js text search
		if (searchQuery.trim() && fuse) {
			results = fuse.search(searchQuery).map((r) => r.item);
		}

		// Language filter
		if (languageFilter) {
			results = results.filter((r) => r.language === languageFilter);
		}

		// Focus area filter
		if (focusFilter !== 'all') {
			const matchTopics = focusTopicMap[focusFilter];
			results = results.filter((r) =>
				r.topics.some((t) => matchTopics.includes(t.toLowerCase()))
			);
		}

		return results;
	});

	onMount(() => {
		// Fetch registry data
		fetch('/data/registry.json')
			.then((res) => res.json())
			.then((data: Repository[]) => {
				allRepos = data.filter((r) => !r.isArchived);
				fuse = new Fuse(allRepos, {
					keys: ['name', 'fullName', 'description', 'topics', 'owner.login', 'language'],
					threshold: 0.3,
					ignoreLocation: true
				});
			})
			.finally(() => {
				loading = false;
			});

		// Sync theme state
		const saved = localStorage.getItem('theme');
		if (saved === 'power' || saved === 'copilot') theme = saved;

		const observer = new MutationObserver(() => {
			theme = document.documentElement.getAttribute('data-theme') || 'power';
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<title>Community Registry | Power Platform OSS Hub</title>
	<meta name="description" content="Discover open-source Power Platform repositories" />
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-7xl">
	<!-- Hero -->
	<div class="text-center mb-8">
		<h1 class="text-3xl sm:text-4xl font-bold mb-3">
			Power Platform <span class="text-primary">Community Registry</span>
		</h1>
		<p class="text-base-content/70 max-w-2xl mx-auto">
			Discover, search, and explore {allRepos.length} open-source repositories
			powering the Power Platform ecosystem.
		</p>
	</div>

	<!-- Search & Filter -->
	<div class="mb-6">
		<SearchFilterBar
			{searchQuery}
			{languageFilter}
			{focusFilter}
			{languages}
			onSearchChange={(v) => (searchQuery = v)}
			onLanguageChange={(v) => (languageFilter = v)}
			onFocusChange={(v) => (focusFilter = v)}
		/>
	</div>

	<!-- Results count -->
	<p class="text-sm text-base-content/60 mb-4">
		{#if loading}
			Loading repositories...
		{:else}
			Showing {filteredRepos.length} of {allRepos.length} repositories
		{/if}
	</p>

	<!-- Card Grid -->
	{#if loading}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each Array(6) as _}
				<div class="card bg-base-100 shadow-md border border-base-300">
					<div class="card-body p-5 gap-3">
						<div class="skeleton h-5 w-3/4"></div>
						<div class="skeleton h-3 w-1/3"></div>
						<div class="skeleton h-10 w-full"></div>
						<div class="skeleton h-3 w-1/2"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if filteredRepos.length === 0}
		<div class="text-center py-16">
			<p class="text-xl font-semibold mb-2">No repositories found</p>
			<p class="text-base-content/60">Try adjusting your search or filters.</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each filteredRepos as repo (repo.fullName)}
				<RepoCard {repo} />
			{/each}
		</div>
	{/if}

	<!-- Contribute CTA -->
	<div class="mt-12">
		<ContributeCta {theme} />
	</div>
</div>
