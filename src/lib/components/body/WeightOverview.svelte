<script lang="ts">
	import { defineChart, lineY, ruleY } from '@tanstack/charts';
	import { scaleLinear } from '@tanstack/charts/scales/linear';
	import { Chart } from '@tanstack/charts/svelte';
	import { tooltip } from '@tanstack/charts/tooltip';
	import { scaleUtc } from 'd3-scale';
	import Tile from '#lib/components/Tile.svelte';
	import { ACCENT, chartTheme, dateTick } from '#lib/charts.js';
	import {
		formatLongDate,
		formatNumber,
		formatShortDate,
		toWeight,
		weightUnit,
		type MeasurementSystem
	} from '#lib/format.js';
	import { getBody } from '#lib/remote/body.remote.js';

	let { system }: { system: MeasurementSystem } = $props();

	const body = $derived(await getBody());
	const unit = $derived(weightUnit(system));
	const rows = $derived(
		body.series.map((point) => ({ date: point.date, weight: toWeight(point.grams, system) }))
	);
	const goal = $derived(body.goalGrams == null ? null : toWeight(body.goalGrams, system));

	function showChange(grams: number | null) {
		if (grams == null) return '-';
		const value = toWeight(grams, system);
		return `${value > 0 ? '+' : ''}${formatNumber(value, 1)}`;
	}

	const definition = $derived(
		defineChart({
			marks: [
				...(goal == null
					? []
					: [ruleY([goal], { stroke: chartTheme.foreground, strokeDasharray: '4 4' })]),
				lineY(rows, { x: 'date', y: 'weight', stroke: ACCENT, strokeWidth: 2, points: true })
			],
			scales: {
				x: {
					scale: scaleUtc,
					grid: false,
					axis: { line: false, ticks: { size: 0, format: dateTick } }
				},
				y: { scale: scaleLinear, nice: true, grid: true, axis: { line: false, ticks: { size: 0 } } }
			},
			theme: chartTheme,
			tooltip: {
				use: tooltip,
				format: (p) =>
					`${formatShortDate(p.datum.date)}\n${formatNumber(p.datum.weight, 1)} ${unit}`
			}
		})
	);
</script>

{#if !body.current}
	<div class="rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
		<p class="text-sm font-medium text-zinc-900">No weight entries in the last 12 months</p>
		<p class="mt-1 text-sm text-zinc-500">Log your weight in Garmin Connect to see it here.</p>
	</div>
{:else}
	<div
		class={['grid gap-3 sm:grid-cols-2', body.current.bmi ? 'lg:grid-cols-4' : 'lg:grid-cols-3']}
	>
		<Tile
			label="Current weight"
			value={formatNumber(toWeight(body.current.grams, system), 1)}
			{unit}
		>
			{#snippet detail()}Measured {formatLongDate(body.current!.date)}{/snippet}
		</Tile>
		<Tile label="Change, 30 days" value={showChange(body.change30)} {unit}>
			{#snippet detail()}
				{body.change30 == null ? 'No entry from a month ago' : 'Compared with 30 days ago'}
			{/snippet}
		</Tile>
		<Tile label="Change, 12 months" value={showChange(body.change365)} {unit}>
			{#snippet detail()}Since the first entry in this period{/snippet}
		</Tile>
		{#if body.current.bmi}
			<Tile label="BMI" value={formatNumber(body.current.bmi, 1)}>
				{#snippet detail()}From your latest weigh-in{/snippet}
			</Tile>
		{/if}
	</div>

	<div class="mt-3 rounded-lg border border-zinc-200 bg-white p-4">
		<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
			<h3 class="text-sm text-zinc-500">Weight ({unit})</h3>
			{#if goal != null}
				<p class="flex items-center gap-2 text-xs text-zinc-500">
					<span class="w-5 border-t border-dashed border-zinc-500"></span>
					Goal {formatNumber(goal, 1)}
					{unit}
				</p>
			{/if}
		</div>
		<Chart {definition} ariaLabel="Weight over the last 12 months" height={320} />
	</div>
{/if}
