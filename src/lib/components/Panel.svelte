<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		aside,
		children,
		class: className
	}: { title?: string; aside?: Snippet; children: Snippet; class?: string } = $props();
</script>

<article class={['rounded-lg border border-zinc-200 bg-white p-4', className]}>
	{#if title || aside}
		<header class="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
			{#if title}<h3 class="text-sm text-zinc-500">{title}</h3>{/if}
			{#if aside}{@render aside()}{/if}
		</header>
	{/if}
	{@render children()}
</article>
