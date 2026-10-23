<script lang="ts">
	import EmptyState from '#lib/components/EmptyState.svelte';
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
				<th scope="row" class="px-5 py-3.5 text-left font-medium">{best.label}</th>
				<td class="px-5 py-3.5 text-right tabular-nums">{formatClock(best.seconds)}</td>
				<td class="px-5 py-3.5 text-right tabular-nums">
					{formatPace(best.seconds, best.meters, system)}
				</td>
				<td class="px-5 py-3.5 text-right whitespace-nowrap text-ash">
					{formatLongDate(best.date)}
				</td>
			</tr>
		{/each}
	</Table>
{/if}
