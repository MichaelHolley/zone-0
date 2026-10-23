<script lang="ts">
	import { defineChart, lineY, ruleY } from '@tanstack/charts';
	import { scaleLinear } from '@tanstack/charts/scales/linear';
	import { Chart } from '@tanstack/charts/svelte';
	import { tooltip } from '@tanstack/charts/tooltip';
	import { scaleUtc } from 'd3-scale';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Panel from '#lib/components/Panel.svelte';
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
	<EmptyState
		title="No weight entries in the last 12 months"
		description="Log your weight in Garmin Connect to see it here."
	/>
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

	<Panel title="Weight ({unit})" class="mt-3">
		{#snippet aside()}
			{#if goal != null}
				<p class="flex items-center gap-2 text-[13px] text-ash">
					<span class="w-5 border-t border-dashed border-ash"></span>
					Goal {formatNumber(goal, 1)}
					{unit}
				</p>
			{/if}
		{/snippet}
		<Chart {definition} ariaLabel="Weight over the last 12 months" height={320} />
	</Panel>
{/if}
