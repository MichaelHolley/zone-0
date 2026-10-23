<script lang="ts">
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Table from '#lib/components/Table.svelte';
	import Tile from '#lib/components/Tile.svelte';
	import {
		formatDistance,
		formatDuration,
		formatLongDate,
		formatNumber,
		formatPace,
		type MeasurementSystem
	} from '#lib/format.js';
	import { getRunning } from '#lib/remote/training.remote.js';
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
	const totalDistance = $derived(runs.reduce((sum, run) => sum + run.distance, 0));
	const totalSeconds = $derived(runs.reduce((sum, run) => sum + run.movingSeconds, 0));
	const treadmillCount = $derived(runs.filter((run) => run.kind === 'Treadmill').length);
	const heartRates = $derived(
		runs.flatMap((run) => (run.heartRate == null ? [] : [run.heartRate]))
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
				{heartRates.length
					? `${formatNumber(heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length)} bpm average`
					: 'No heart rate'}
			{/snippet}
		</Tile>
	</div>

	<div class="mt-3">
		<Table caption="Recent runs" {columns}>
			{#each recent as run (run.date + run.distance)}
				<tr>
					<th scope="row" class="px-5 py-3.5 text-left font-medium whitespace-nowrap">
						{formatLongDate(run.date)}
					</th>
					<td class="px-5 py-3.5 text-ash">{run.kind}</td>
					<td class="px-5 py-3.5 text-right tabular-nums">
						{formatDistance(run.distance, system)}
					</td>
					<td class="px-5 py-3.5 text-right tabular-nums">
						{formatDuration(run.movingSeconds)}
					</td>
					<td class="px-5 py-3.5 text-right tabular-nums">
						{run.distance > 0 ? formatPace(run.movingSeconds, run.distance, system) : '-'}
					</td>
					<td class="px-5 py-3.5 text-right tabular-nums">
						{run.heartRate == null ? '-' : `${formatNumber(run.heartRate)} bpm`}
					</td>
					<td class="px-5 py-3.5 text-right tabular-nums">
						{run.cadence == null ? '-' : `${formatNumber(run.cadence)} spm`}
					</td>
				</tr>
			{/each}
		</Table>
	</div>

	<div class="mt-3">
		<RunningBests {system} />
	</div>
{/if}
