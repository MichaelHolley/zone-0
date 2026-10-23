<script lang="ts">
	import { onMount } from 'svelte';
	import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
	import { STORE_QUERIES } from '#lib/remote/store-queries.js';
	import { getSyncStatus, syncWithGarmin } from '#lib/remote/sync.remote.js';

	let { timeZone }: { timeZone: string } = $props();

	const status = $derived(await getSyncStatus());

	onMount(() => {
		void syncWithGarmin().updates(...STORE_QUERIES);
	});
</script>

{#if status.failed && status.syncedAt}
	<p
		class="mb-10 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/60 px-5 py-3 text-sm text-amber-900"
	>
		<WarningCircleIcon size={18} class="shrink-0" />
		Could not reach Garmin. Showing data synced on
		{new Date(status.syncedAt).toLocaleString('en-GB', {
			dateStyle: 'medium',
			timeStyle: 'short',
			timeZone
		})}.
	</p>
{/if}
