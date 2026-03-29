<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="min-h-screen flex flex-col bg-base-100 text-base-content">
	<Navbar />
	<main class="flex-1">
		{@render children()}
	</main>
	<footer class="footer footer-center p-6 bg-base-200 text-base-content/60 text-sm">
		<p>
			Power Platform Open-Source Hub &bull;
			<a
				href="https://github.com/rpothin/PowerPlatform-OpenSource-Hub"
				target="_blank"
				rel="noopener noreferrer"
				class="link link-hover"
			>
				GitHub
			</a>
			&bull; MIT License
		</p>
	</footer>
</div>
