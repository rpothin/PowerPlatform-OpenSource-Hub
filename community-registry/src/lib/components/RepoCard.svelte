<script lang="ts">
	import type { Repository } from '$lib/types';

	interface Props {
		repo: Repository;
	}

	let { repo }: Props = $props();

	function formatNumber(n: number): string {
		if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
		return n.toString();
	}

	function timeAgo(dateStr: string): string {
		const now = new Date();
		const date = new Date(dateStr);
		const diffMs = now.getTime() - date.getTime();
		const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		if (days < 1) return 'today';
		if (days < 30) return `${days}d ago`;
		if (days < 365) return `${Math.floor(days / 30)}mo ago`;
		return `${Math.floor(days / 365)}y ago`;
	}
</script>

<div class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow border border-base-300">
	<div class="card-body p-5 gap-3">
		<!-- Header -->
		<div class="flex items-start justify-between gap-2">
			<div class="min-w-0">
				<h3 class="card-title text-base leading-tight">
					<a
						href={repo.url}
						target="_blank"
						rel="noopener noreferrer"
						class="link link-hover text-primary truncate"
					>
						{repo.name}
					</a>
				</h3>
				<p class="text-xs text-base-content/60 mt-0.5">{repo.owner.login}</p>
			</div>
			{#if repo.isArchived}
				<span class="badge badge-warning badge-sm shrink-0">Archived</span>
			{/if}
		</div>

		<!-- Description -->
		<p class="text-sm text-base-content/80 line-clamp-2 min-h-[2.5rem]">
			{repo.description || 'No description available.'}
		</p>

		<!-- Language & License -->
		<div class="flex items-center gap-3 text-xs text-base-content/60 flex-wrap">
			{#if repo.language}
				<span class="flex items-center gap-1">
					<span class="w-2.5 h-2.5 rounded-full bg-primary"></span>
					{repo.language}
				</span>
			{/if}
			{#if repo.license}
				<span>{repo.license}</span>
			{/if}
			<span>Updated {timeAgo(repo.updatedAt)}</span>
		</div>

		<!-- Stats -->
		<div class="flex items-center gap-4 text-sm">
			<span class="flex items-center gap-1" title="Stars">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-warning" fill="currentColor" viewBox="0 0 20 20">
					<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
				</svg>
				{formatNumber(repo.stars)}
			</span>
			<span class="flex items-center gap-1" title="Forks">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M7 7V3m10 4V3M7 7a4 4 0 004 4m0 0a4 4 0 004-4m-4 4v6m-4 4h8" />
				</svg>
				{formatNumber(repo.forks)}
			</span>
			{#if repo.openIssues > 0}
				<span class="flex items-center gap-1" title="Open Issues">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="8" x2="12" y2="12" />
						<line x1="12" y1="16" x2="12.01" y2="16" />
					</svg>
					{formatNumber(repo.openIssues)}
				</span>
			{/if}
		</div>

		<!-- Topics -->
		{#if repo.topics.length > 0}
			<div class="flex flex-wrap gap-1.5 mt-1">
				{#each repo.topics.slice(0, 5) as topic}
					<span class="badge badge-outline badge-sm">{topic}</span>
				{/each}
				{#if repo.topics.length > 5}
					<span class="badge badge-ghost badge-sm">+{repo.topics.length - 5}</span>
				{/if}
			</div>
		{/if}

		<!-- Badges -->
		{#if repo.hasGoodFirstIssues || repo.hasHelpWantedIssues}
			<div class="flex gap-2 mt-1">
				{#if repo.hasGoodFirstIssues}
					<span class="badge badge-success badge-sm gap-1">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
						Good First Issues
					</span>
				{/if}
				{#if repo.hasHelpWantedIssues}
					<span class="badge badge-info badge-sm gap-1">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
						Help Wanted
					</span>
				{/if}
			</div>
		{/if}
	</div>
</div>
