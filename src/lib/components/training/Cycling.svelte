<script lang="ts">
	import { Chart } from '@tanstack/charts/svelte';
	import Cell from '#lib/components/Cell.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Legend from '#lib/components/Legend.svelte';
	import Panel from '#lib/components/Panel.svelte';
	import RowHeader from '#lib/components/RowHeader.svelte';
	import Table from '#lib/components/Table.svelte';
	import Tile from '#lib/components/Tile.svelte';
	import {
		distanceUnit,
		elevationUnit,
		formatDistance,
		formatDuration,
		formatLongDate,
		formatNumber,
		orDash,
		speedUnit,
		toElevation,
		toSpeed,
		type MeasurementSystem
	} from '#lib/format.js';
	import { getCycling } from '#lib/remote/training.remote.js';
	import { sum } from '#lib/stats.js';
	import {
		RIDE_SYMBOLS,
		elevationChart,
		rideClimbChart,
		speedChart,
		zoneShareChart,
		type Ride
	} from './charts.js';

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
	const total = (pick: (ride: Ride) => number) => sum(data.rides.map(pick));
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
			{#snippet aside()}<Legend items={RIDE_SYMBOLS} />{/snippet}
			<Chart
				definition={speedChart(data.rides, system)}
				ariaLabel="Average speed of each outdoor ride, colored by average heart rate, last 12 months"
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

		<Panel title="Distance ({distanceUnit(system)}) vs. climb ({elevationUnit(system)})">
			<Chart
				definition={rideClimbChart(data.rides, system)}
				ariaLabel="Distance against climb of each outdoor ride, colored by average speed, last 12 months"
				height={200}
			/>
		</Panel>
	</div>

	<div class="mt-3">
		<Table caption="Longest rides" {columns}>
			{#each longest as ride (ride.date + ride.distance)}
				<tr>
					<RowHeader class="whitespace-nowrap">{formatLongDate(ride.date)}</RowHeader>
					<Cell class="text-ash">{ride.kind}</Cell>
					<Cell numeric>{formatDistance(ride.distance, system)}</Cell>
					<Cell numeric>
						{formatNumber(toElevation(ride.elevation, system))}
						{elevationUnit(system)}
					</Cell>
					<Cell numeric>
						{orDash(
							ride.speed,
							(speed) => `${formatNumber(toSpeed(speed, system), 1)} ${speedUnit(system)}`
						)}
					</Cell>
					<Cell numeric>{orDash(ride.heartRate, (hr) => `${formatNumber(hr)} bpm`)}</Cell>
				</tr>
			{/each}
		</Table>
	</div>
{/if}
