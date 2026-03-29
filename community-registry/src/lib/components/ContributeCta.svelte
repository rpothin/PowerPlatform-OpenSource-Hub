<script lang="ts">
	interface Props {
		theme?: string;
	}

	let { theme = 'power' }: Props = $props();

	const contributeUrl = $derived(
		theme === 'copilot'
			? 'https://github.com/rpothin/PowerPlatform-OpenSource-Hub/issues?q=is%3Aissue+is%3Aopen+label%3A%22copilot%22'
			: 'https://github.com/rpothin/PowerPlatform-OpenSource-Hub/issues?q=is%3Aissue+is%3Aopen'
	);

	const ctaLabel = $derived(
		theme === 'copilot' ? 'Contribute to Copilot Projects' : 'Contribute to the Hub'
	);
</script>

<div class="bg-primary/10 border border-primary/20 rounded-box p-6 text-center">
	<h2 class="text-lg font-bold mb-2">Want to contribute?</h2>
	<p class="text-base-content/70 mb-4 max-w-lg mx-auto">
		{#if theme === 'copilot'}
			Help build the next generation of Copilot-powered experiences for the Power Platform community.
		{:else}
			Join the Power Platform open-source community and help make the ecosystem better for everyone.
		{/if}
	</p>
	<a
		href={contributeUrl}
		target="_blank"
		rel="noopener noreferrer"
		class="btn btn-primary"
	>
		{ctaLabel}
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
		</svg>
	</a>
</div>
