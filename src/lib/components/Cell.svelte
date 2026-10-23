<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		numeric = false,
		class: className,
		children
	}: { numeric?: boolean; class?: string; children: Snippet } = $props();
</script>

<td class={['px-5 py-3.5', numeric && 'text-right tabular-nums', className]}>
	{@render children()}
</td>
