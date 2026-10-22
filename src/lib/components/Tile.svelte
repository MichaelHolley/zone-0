<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label,
		value,
		unit,
		detail,
		children,
		class: className
	}: {
		label: string;
		value: string;
		unit?: string;
		detail?: Snippet;
		children?: Snippet;
		class?: string;
	} = $props();
</script>

<article class={['flex flex-col rounded-lg border border-zinc-200 bg-white p-4', className]}>
	<h3 class="text-sm text-zinc-500">{label}</h3>
	<p class="mt-2 flex items-baseline gap-1.5">
		<span class="font-mono text-3xl font-medium tracking-tight tabular-nums">{value}</span>
		{#if unit}<span class="text-sm text-zinc-500">{unit}</span>{/if}
	</p>
	{#if detail}
		<div class="mt-1 text-xs text-zinc-500">{@render detail()}</div>
	{/if}
	{#if children}
		<div class="mt-auto pt-4">{@render children()}</div>
	{/if}
</article>
