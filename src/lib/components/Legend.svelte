<script lang="ts">
	let { items }: { items: readonly { label: string; color: string }[] } = $props();
</script>

<ul class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
	{#each items as item (item.label)}
		<li class="flex items-center gap-1.5">
			<span class="size-2.5 rounded-sm" style:background-color={item.color}></span>
			{item.label}
		</li>
	{/each}
</ul>
