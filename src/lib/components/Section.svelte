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
		<header class="mb-3">
			<h2 class="text-sm font-medium text-zinc-900">{title}</h2>
			{#if description}<p class="mt-0.5 text-xs text-zinc-500">{description}</p>{/if}
		</header>
	{/if}
	<svelte:boundary onerror={rethrowKeyError}>
		{@render children()}

		{#snippet pending()}
			<div
				class="animate-pulse rounded-lg border border-zinc-200 bg-zinc-100/70 motion-reduce:animate-none"
				style:height="{skeletonHeight}px"
			></div>
		{/snippet}

		{#snippet failed(error, reset)}
			<div
				class="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/50 p-4 text-sm text-red-900"
			>
				<WarningCircleIcon size={18} class="mt-0.5 shrink-0" />
				<div>
					<p>Could not load this section. {errorMessage(error)}</p>
					<button
						type="button"
						onclick={reset}
						class="mt-2 font-medium underline underline-offset-2 active:translate-y-px"
					>
						Try again
					</button>
				</div>
			</div>
		{/snippet}
	</svelte:boundary>
</section>
