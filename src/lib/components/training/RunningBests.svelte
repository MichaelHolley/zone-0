<script lang="ts">
	import Cell from '#lib/components/Cell.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import RowHeader from '#lib/components/RowHeader.svelte';
	import Table from '#lib/components/Table.svelte';
	import { formatClock, formatLongDate, formatPace, type MeasurementSystem } from '#lib/format.js';
	import { getRunningBests } from '#lib/remote/training.remote.js';

	let { system }: { system: MeasurementSystem } = $props();

	const bests = $derived(await getRunningBests());
	const columns = [
		{ label: 'Distance' },
		{ label: 'Time', end: true },
		{ label: 'Pace', end: true },
		{ label: 'Date', end: true }
	];
</script>

{#if bests.length === 0}
	<EmptyState
		title="No running bests yet"
		description="Fastest splits appear here once you log runs."
	/>
{:else}
	<Table caption="Best efforts" {columns}>
		{#each bests as best (best.meters)}
			<tr>
				<RowHeader>{best.label}</RowHeader>
				<Cell numeric>{formatClock(best.seconds)}</Cell>
				<Cell numeric>{formatPace(best.seconds, best.meters, system)}</Cell>
				<Cell class="text-right whitespace-nowrap text-ash">{formatLongDate(best.date)}</Cell>
			</tr>
		{/each}
	</Table>
{/if}
