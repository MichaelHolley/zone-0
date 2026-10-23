<script lang="ts">
	import type { Snippet } from 'svelte';

	let { class: className, children }: { class?: string; children: Snippet } = $props();
</script>

<th scope="row" class={['px-5 py-3.5 text-left font-medium', className]}>
	{@render children()}
</th>
