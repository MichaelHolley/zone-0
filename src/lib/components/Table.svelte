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

<div class="overflow-x-auto rounded-2xl border border-line bg-white">
	<table class="w-full text-sm">
		{#if caption}
			<caption class="px-5 pt-5 pb-2 text-left text-[15px] font-semibold">{caption}</caption>
		{/if}
		<thead>
			<tr class="border-b border-line text-left text-[13px] text-ash">
				{#each columns as column (column.label)}
					<th scope="col" class={['px-5 py-3 font-medium', column.end && 'text-right']}>
						{column.label}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody class="divide-y divide-line">
			{@render children()}
		</tbody>
	</table>
</div>
