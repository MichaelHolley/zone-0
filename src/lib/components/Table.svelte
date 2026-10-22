<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		caption,
		columns,
		children
	}: {
		caption?: string;
		columns: readonly { label: string; end?: boolean }[];
		children: Snippet;
	} = $props();
</script>

<div class="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
	<table class="w-full text-sm">
		{#if caption}
			<caption class="px-4 pt-3 pb-2 text-left text-xs text-zinc-500">{caption}</caption>
		{/if}
		<thead>
			<tr class="border-b border-zinc-200 text-left text-xs text-zinc-500">
				{#each columns as column (column.label)}
					<th scope="col" class={['px-4 py-2.5 font-normal', column.end && 'text-right']}>
						{column.label}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody class="divide-y divide-zinc-100">
			{@render children()}
		</tbody>
	</table>
</div>
