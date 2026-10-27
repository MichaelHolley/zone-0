<script lang="ts">
	import { Chart } from '@tanstack/charts/svelte';
	import Cell from '#lib/components/Cell.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Panel from '#lib/components/Panel.svelte';
	import RowHeader from '#lib/components/RowHeader.svelte';
	import Table from '#lib/components/Table.svelte';
	import Tile from '#lib/components/Tile.svelte';
	import { formatDuration, formatLongDate, formatNumber, orDash } from '#lib/format.js';
	import { getStrength } from '#lib/remote/training.remote.js';
	import { average, sum } from '#lib/stats.js';
	import { sessionTrendChart } from './charts.js';

	const columns = [
		{ label: 'Date' },
		{ label: 'Duration', end: true },
		{ label: 'Avg HR', end: true },
		{ label: 'Max HR', end: true },
		{ label: 'Aerobic', end: true },
		{ label: 'Anaerobic', end: true },
		{ label: 'Calories', end: true }
	];

	const data = $derived(await getStrength());
	const totalSeconds = $derived(sum(data.sessions.map((s) => s.duration)));
	const averageHeartRate = $derived(
		average(data.sessions.map((s) => s.heartRate).filter((hr) => hr != null))
	);
	const peakHeartRate = $derived(Math.max(0, ...data.sessions.map((s) => s.maxHeartRate ?? 0)));
	let visibleCount = $state(5);
	const recent = $derived(data.sessions.toReversed().slice(0, visibleCount));
</script>

{#if data.sessions.length === 0}
	<EmptyState
		title="No strength sessions yet"
		description="Strength training activities from the last 12 months appear here."
	/>
{:else}
	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<Tile label="Sessions" value={formatNumber(data.sessions.length)}>
			{#snippet detail()}{formatNumber(data.sessions.length / data.consistency.totalWeeks, 1)} per week{/snippet}
		</Tile>
		<Tile
			label="Active weeks"
			value={formatNumber(data.consistency.activeWeeks)}
			unit="of {data.consistency.totalWeeks}"
		>
			{#snippet detail()}Longest streak {data.consistency.longestStreak} weeks{/snippet}
		</Tile>
		<Tile label="Time trained" value={formatDuration(totalSeconds)}>
			{#snippet detail()}{formatDuration(totalSeconds / data.sessions.length)} per session{/snippet}
		</Tile>
		<Tile label="Average heart rate" value={orDash(averageHeartRate, formatNumber)} unit="bpm">
			{#snippet detail()}Peak {formatNumber(peakHeartRate)} bpm{/snippet}
		</Tile>
	</div>

	<div class="mt-3 grid gap-3 md:grid-cols-2">
		<Panel title="Session duration (min)">
			<Chart
				definition={sessionTrendChart(
					data.sessions,
					(s) => s.duration / 60,
					(v) => `${formatNumber(v)} min`
				)}
				ariaLabel="Duration of each strength session, last 12 months"
				height={200}
			/>
		</Panel>

		<Panel title="Average heart rate per session (bpm)">
			<Chart
				definition={sessionTrendChart(
					data.sessions,
					(s) => s.heartRate,
					(v) => `${formatNumber(v)} bpm`
				)}
				ariaLabel="Average heart rate of each strength session, last 12 months"
				height={200}
			/>
		</Panel>
	</div>

	<div class="mt-3">
		<Table caption="Recent sessions" {columns}>
			{#each recent as session (session.date + session.duration)}
				<tr>
					<RowHeader class="whitespace-nowrap">{formatLongDate(session.date)}</RowHeader>
					<Cell numeric>{formatDuration(session.duration)}</Cell>
					<Cell numeric>{orDash(session.heartRate, (hr) => `${formatNumber(hr)} bpm`)}</Cell>
					<Cell numeric>{orDash(session.maxHeartRate, (hr) => `${formatNumber(hr)} bpm`)}</Cell>
					<Cell numeric>{orDash(session.aerobicEffect, (effect) => formatNumber(effect, 1))}</Cell>
					<Cell numeric>{orDash(session.anaerobicEffect, (effect) => formatNumber(effect, 1))}</Cell
					>
					<Cell numeric>{orDash(session.calories, formatNumber)}</Cell>
				</tr>
			{/each}
		</Table>
		{#if visibleCount < data.sessions.length}
			<button
				type="button"
				onclick={() => (visibleCount += 5)}
				class="mx-auto mt-3 block rounded-full border border-line-strong px-4 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink active:scale-[0.97]"
			>
				Show 5 more
			</button>
		{/if}
	</div>
{/if}
