<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		aside,
		children,
		class: className
	}: { title?: string; aside?: Snippet; children: Snippet; class?: string } = $props();
</script>

<article class={['rounded-2xl border border-line bg-white p-5', className]}>
	{#if title || aside}
		<header class="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
			{#if title}<h3 class="text-[15px] font-semibold">{title}</h3>{/if}
			{#if aside}{@render aside()}{/if}
		</header>
	{/if}
	{@render children()}
</article>
