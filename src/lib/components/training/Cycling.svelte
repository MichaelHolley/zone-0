<script lang="ts">
	import { Chart } from '@tanstack/charts/svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Legend from '#lib/components/Legend.svelte';
	import Panel from '#lib/components/Panel.svelte';
	import Table from '#lib/components/Table.svelte';
	import Tile from '#lib/components/Tile.svelte';
	import {
		elevationUnit,
		formatDistance,
		formatDuration,
		formatLongDate,
		formatNumber,
		speedUnit,
		toElevation,
		toSpeed,
		type MeasurementSystem
	} from '#lib/format.js';
	import { getCycling } from '#lib/remote/training.remote.js';
	import { RIDE_KINDS, elevationChart, speedChart, zoneShareChart, type Ride } from './charts.js';

	let { system }: { system: MeasurementSystem } = $props();

	const columns = [
		{ label: 'Date' },
		{ label: 'Type' },
		{ label: 'Distance', end: true },
		{ label: 'Climb', end: true },
		{ label: 'Avg speed', end: true },
		{ label: 'Avg HR', end: true }
	];

	const data = $derived(await getCycling());
	const total = (pick: (ride: Ride) => number) =>
		data.rides.reduce((sum, ride) => sum + pick(ride), 0);
	const indoorCount = $derived(data.rides.filter((ride) => ride.kind === 'Indoor').length);
	const longest = $derived(
		data.rides
			.filter((ride) => ride.distance > 0)
			.toSorted((a, b) => b.distance - a.distance)
			.slice(0, 5)
	);
</script>

{#if data.rides.length === 0}
	<EmptyState
		title="No rides yet"
		description="Cycling activities from the last 12 months appear here."
	/>
{:else}
	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<Tile label="Rides" value={formatNumber(data.rides.length)}>
			{#snippet detail()}{indoorCount} indoor{/snippet}
		</Tile>
		<Tile
			label="Distance"
			value={formatDistance(
				total((r) => r.distance),
				system
			)}
		/>
		<Tile
			label="Climbed"
			value={formatNumber(
				toElevation(
					total((r) => r.elevation),
					system
				)
			)}
			unit={elevationUnit(system)}
		/>
		<Tile label="Time in the saddle" value={formatDuration(total((r) => r.movingSeconds))} />
	</div>

	<div class="mt-3 grid gap-3 md:grid-cols-2">
		<Panel title="Weekly climbing ({elevationUnit(system)})">
			<Chart
				definition={elevationChart(data.weeks, system)}
				ariaLabel="Weekly elevation gain from cycling, last 12 months"
				height={200}
			/>
		</Panel>

		<Panel title="Average speed per ride ({speedUnit(system)})">
			{#snippet aside()}<Legend items={RIDE_KINDS} />{/snippet}
			<Chart
				definition={speedChart(data.rides, system)}
				ariaLabel="Average speed of each outdoor ride, last 12 months"
				height={200}
			/>
		</Panel>

		<Panel title="Time in heart rate zones (%)">
			<Chart
				definition={zoneShareChart(data.zones)}
				ariaLabel="Share of cycling time in each heart rate zone, last 12 months"
				height={200}
			/>
		</Panel>
	</div>

	<div class="mt-3">
		<Table caption="Longest rides" {columns}>
			{#each longest as ride (ride.date + ride.distance)}
				<tr>
					<th scope="row" class="px-4 py-3 text-left font-medium whitespace-nowrap">
						{formatLongDate(ride.date)}
					</th>
					<td class="px-4 py-3 text-zinc-500">{ride.kind}</td>
					<td class="px-4 py-3 text-right font-mono tabular-nums">
						{formatDistance(ride.distance, system)}
					</td>
					<td class="px-4 py-3 text-right font-mono tabular-nums">
						{formatNumber(toElevation(ride.elevation, system))}
						{elevationUnit(system)}
					</td>
					<td class="px-4 py-3 text-right font-mono tabular-nums">
						{ride.speed == null
							? '-'
							: `${formatNumber(toSpeed(ride.speed, system), 1)} ${speedUnit(system)}`}
					</td>
					<td class="px-4 py-3 text-right font-mono tabular-nums">
						{ride.heartRate == null ? '-' : `${formatNumber(ride.heartRate)} bpm`}
					</td>
				</tr>
			{/each}
		</Table>
	</div>
{/if}
