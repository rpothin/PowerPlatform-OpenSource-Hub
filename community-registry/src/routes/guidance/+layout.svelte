<script lang="ts">
	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<article class="prose prose-lg max-w-none">
		{@render children()}
	</article>
</div>
