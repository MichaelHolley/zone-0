<script lang="ts">
	let { items }: { items: readonly { label: string; color: string; hollow?: boolean }[] } =
		$props();
</script>

<ul class="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[13px] text-ash">
	{#each items as item (item.label)}
		<li class="flex items-center gap-1.5">
			<span
				class={['size-2.5 rounded-full', item.hollow && 'border-2']}
				style:background-color={item.hollow ? undefined : item.color}
				style:border-color={item.hollow ? item.color : undefined}
			></span>
			{item.label}
		</li>
	{/each}
</ul>
