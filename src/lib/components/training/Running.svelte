<script lang="ts">
	import Cell from '#lib/components/Cell.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import RowHeader from '#lib/components/RowHeader.svelte';
	import Table from '#lib/components/Table.svelte';
	import Tile from '#lib/components/Tile.svelte';
	import {
		formatDistance,
		formatDuration,
		formatLongDate,
		formatNumber,
		formatPace,
		orDash,
		type MeasurementSystem
	} from '#lib/format.js';
	import { getRunning } from '#lib/remote/training.remote.js';
	import { average, sum } from '#lib/stats.js';
	import RunningBests from './RunningBests.svelte';

	let { system }: { system: MeasurementSystem } = $props();

	const columns = [
		{ label: 'Date' },
		{ label: 'Type' },
		{ label: 'Distance', end: true },
		{ label: 'Time', end: true },
		{ label: 'Pace', end: true },
		{ label: 'Avg HR', end: true },
		{ label: 'Cadence', end: true }
	];

	const runs = $derived(await getRunning());
	const totalDistance = $derived(sum(runs.map((run) => run.distance)));
	const totalSeconds = $derived(sum(runs.map((run) => run.movingSeconds)));
	const treadmillCount = $derived(runs.filter((run) => run.kind === 'Treadmill').length);
	const averageHeartRate = $derived(
		average(runs.map((run) => run.heartRate).filter((hr) => hr != null))
	);
	const recent = $derived(runs.toReversed().slice(0, 10));
</script>

{#if runs.length === 0}
	<EmptyState
		title="No runs yet"
		description="Running activities from the last 12 months appear here."
	/>
{:else}
	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<Tile label="Runs" value={formatNumber(runs.length)}>
			{#snippet detail()}{treadmillCount} on a treadmill{/snippet}
		</Tile>
		<Tile label="Distance" value={formatDistance(totalDistance, system)} />
		<Tile label="Time running" value={formatDuration(totalSeconds)} />
		<Tile
			label="Average pace"
			value={totalDistance > 0 ? formatPace(totalSeconds, totalDistance, system) : '-'}
		>
			{#snippet detail()}
				{averageHeartRate == null
					? 'No heart rate'
					: `${formatNumber(averageHeartRate)} bpm average`}
			{/snippet}
		</Tile>
	</div>

	<div class="mt-3">
		<Table caption="Recent runs" {columns}>
			{#each recent as run (run.date + run.distance)}
				<tr>
					<RowHeader class="whitespace-nowrap">{formatLongDate(run.date)}</RowHeader>
					<Cell class="text-ash">{run.kind}</Cell>
					<Cell numeric>{formatDistance(run.distance, system)}</Cell>
					<Cell numeric>{formatDuration(run.movingSeconds)}</Cell>
					<Cell numeric>
						{run.distance > 0 ? formatPace(run.movingSeconds, run.distance, system) : '-'}
					</Cell>
					<Cell numeric>{orDash(run.heartRate, (hr) => `${formatNumber(hr)} bpm`)}</Cell>
					<Cell numeric>{orDash(run.cadence, (cadence) => `${formatNumber(cadence)} spm`)}</Cell>
				</tr>
			{/each}
		</Table>
	</div>

	<div class="mt-3">
		<RunningBests {system} />
	</div>
{/if}
