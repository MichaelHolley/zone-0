<script lang="ts">
	import { onMount } from 'svelte';
	import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
	import { STORE_QUERIES } from '#lib/remote/store-queries.js';
	import { getSyncStatus, syncWithGarmin } from '#lib/remote/sync.remote.js';

	let { timeZone }: { timeZone: string } = $props();

	const status = $derived(await getSyncStatus());

	onMount(() => {
		// Failures already reach the user through the sections and this notice.
		syncWithGarmin()
			.updates(...STORE_QUERIES)
			.catch(() => {});
	});
</script>

{#if status.error && status.syncedAt}
	<p
		class="mb-10 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/60 px-5 py-3 text-sm text-amber-900"
	>
		<WarningCircleIcon size={18} class="shrink-0" />
		{status.error === 'keyRejected'
			? 'Garmin rejected your API key.'
			: 'Could not sync with Garmin.'}
		Showing data synced on
		{new Date(status.syncedAt).toLocaleString('en-GB', {
			dateStyle: 'medium',
			timeStyle: 'short',
			timeZone
		})}.
	</p>
{/if}
