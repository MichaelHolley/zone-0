<script lang="ts">
	import type { Snippet } from 'svelte';
	import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
	import { errorMessage, isKeyError } from '#lib/errors.js';

	let {
		title,
		description,
		skeletonHeight = 240,
		children,
		class: className
	}: {
		title?: string;
		description?: string;
		skeletonHeight?: number;
		children: Snippet;
		class?: string;
	} = $props();

	function rethrowKeyError(error: unknown) {
		if (isKeyError(error)) throw error;
	}
</script>

<section class={className}>
	{#if title}
		<header class="mb-5">
			<h2 class="text-[22px] leading-tight font-semibold tracking-tight">{title}</h2>
			{#if description}<p class="mt-1 text-[15px] text-ash">{description}</p>{/if}
		</header>
	{/if}
	<svelte:boundary onerror={rethrowKeyError}>
		{@render children()}

		{#snippet pending()}
			<div
				class="animate-pulse rounded-2xl bg-mist motion-reduce:animate-none"
				style:height="{skeletonHeight}px"
			></div>
		{/snippet}

		{#snippet failed(error, reset)}
			<div
				class="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/60 p-5 text-sm text-red-900"
			>
				<WarningCircleIcon size={18} class="mt-0.5 shrink-0" />
				<div>
					<p>Could not load this section. {errorMessage(error)}</p>
					<button
						type="button"
						onclick={reset}
						class="mt-2 font-semibold underline underline-offset-2 active:translate-y-px"
					>
						Try again
					</button>
				</div>
			</div>
		{/snippet}
	</svelte:boundary>
</section>
