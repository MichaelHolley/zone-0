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

<article class={['flex flex-col rounded-2xl bg-mist p-5', className]}>
	<h3 class="text-sm font-medium text-ash">{label}</h3>
	<p class="mt-1.5 flex items-baseline gap-1.5">
		<span class="text-[2rem] leading-tight font-semibold tracking-tight tabular-nums">{value}</span>
		{#if unit}<span class="text-sm font-medium text-ash">{unit}</span>{/if}
	</p>
	{#if detail}
		<div class="mt-1 text-[13px] leading-snug text-ash">{@render detail()}</div>
	{/if}
	{#if children}
		<div class="mt-auto pt-4">{@render children()}</div>
	{/if}
</article>
