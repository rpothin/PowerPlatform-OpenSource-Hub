<script lang="ts">
	import { onMount } from 'svelte';

	let theme = $state('power');

	function toggle() {
		theme = theme === 'power' ? 'copilot' : 'power';
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('theme', theme);
	}

	onMount(() => {
		const saved = localStorage.getItem('theme');
		if (saved === 'power' || saved === 'copilot') {
			theme = saved;
		}
	});
</script>

<div class="navbar bg-base-200 shadow-sm sticky top-0 z-50">
	<div class="navbar-start">
		<a href="/" class="btn btn-ghost text-xl gap-2">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
				<path
					d="M13 3L4 14h5v7l9-11h-5V3z"
					class="text-primary"
				/>
			</svg>
			<span class="hidden sm:inline font-bold">OSS Hub</span>
		</a>
	</div>

	<div class="navbar-center hidden md:flex">
		<ul class="menu menu-horizontal px-1 gap-1">
			<li><a href="/" class="font-medium">Registry</a></li>
			<li><a href="/guidance" class="font-medium">Guidance</a></li>
		</ul>
	</div>

	<div class="navbar-end gap-2">
		<label class="swap swap-rotate btn btn-ghost btn-circle" aria-label="Toggle theme">
			<input
				type="checkbox"
				checked={theme === 'copilot'}
				onchange={toggle}
			/>
			<!-- Power theme icon (leaf/bolt) -->
			<svg class="swap-off h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
				<path d="M13 3L4 14h5v7l9-11h-5V3z" />
			</svg>
			<!-- Copilot theme icon (sparkle) -->
			<svg class="swap-on h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
				<path
					d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z"
				/>
			</svg>
		</label>

		<!-- Mobile menu -->
		<div class="dropdown dropdown-end md:hidden">
			<button class="btn btn-ghost btn-circle" aria-label="Open menu">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<ul
				tabindex="0"
				class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
			>
				<li><a href="/">Registry</a></li>
				<li><a href="/guidance">Guidance</a></li>
			</ul>
		</div>
	</div>
</div>
