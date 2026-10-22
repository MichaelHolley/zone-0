<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import Nav from '#lib/components/Nav.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<Nav />
<main class="mx-auto max-w-6xl px-4 pt-8 pb-16 md:px-8">
	{@render children()}
</main>
