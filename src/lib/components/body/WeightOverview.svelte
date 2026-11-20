<script lang="ts">
	import { defineChart, dot, lineY, link, ruleY } from '@tanstack/charts';
	import { decorative } from '@tanstack/charts/mark/decorative';
	import { scaleLinear } from '@tanstack/charts/scales/linear';
	import { Chart } from '@tanstack/charts/svelte';
	import { tooltip } from '@tanstack/charts/tooltip';
	import { scaleUtc } from 'd3-scale';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Panel from '#lib/components/Panel.svelte';
	import Tile from '#lib/components/Tile.svelte';
	import { ACCENT, chartTheme, dateTick, DAY_MS } from '#lib/charts.js';
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
		body.series.map((point) => ({
			date: point.date,
			weight: toWeight(point.grams, system),
			kind: 'daily' as const
		}))
	);
	const weeklyRows = $derived(
		body.weeklySeries.map((point) => ({
			date: point.date,
			weight: toWeight(point.grams, system),
			kind: 'weekly' as const
		}))
	);
	const weeklySegments = $derived(
		weeklyRows.flatMap((point, index) => {
			const previous = weeklyRows[index - 1];
			if (!previous || point.date.getTime() - previous.date.getTime() !== 7 * DAY_MS) return [];
			return [{ ...point, previousDate: previous.date, previousWeight: previous.weight }];
		})
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
				lineY(rows, {
					x: 'date',
					y: 'weight',
					stroke: ACCENT,
					strokeWidth: 1,
					strokeOpacity: 0.2
				}),
				dot(rows, { x: 'date', y: 'weight', fill: ACCENT, fillOpacity: 0.3, r: 2 }),
				decorative(
					link(weeklySegments, {
						x1: 'previousDate',
						y1: 'previousWeight',
						x2: 'date',
						y2: 'weight',
						stroke: (point) =>
							point.weight < point.previousWeight
								? 'var(--color-good)'
								: point.weight > point.previousWeight
									? 'var(--color-red-600)'
									: chartTheme.foreground,
						strokeWidth: 3
					})
				),
				dot(weeklyRows, {
					x: 'date',
					y: 'weight',
					fill: '#ffffff',
					stroke: chartTheme.foreground,
					strokeWidth: 1.5,
					r: 3
				})
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
					p.datum.kind === 'weekly'
						? `Week of ${formatLongDate(p.datum.date.toISOString())}\nWeekly average: ${formatNumber(p.datum.weight, 1)} ${unit}`
						: `${formatShortDate(p.datum.date)}\n${formatNumber(p.datum.weight, 1)} ${unit}`
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
		<Tile
			label="Change, 30 days"
			value={showChange(body.change30)}
			positive={body.change30 != null && body.change30 < 0}
			{unit}
		>
			{#snippet detail()}
				{body.change30 == null ? 'No entry from a month ago' : 'Compared with 30 days ago'}
			{/snippet}
		</Tile>
		<Tile
			label="Change, 12 months"
			value={showChange(body.change365)}
			positive={body.change365 != null && body.change365 < 0}
			{unit}
		>
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
			<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ash">
				<p class="flex items-center gap-2">
					<span class="w-5 border-t border-accent opacity-20"></span>
					Daily readings
				</p>
				{#if goal != null}
					<p class="flex items-center gap-2">
						<span class="w-5 border-t border-dashed border-ash"></span>
						Goal {formatNumber(goal, 1)}
						{unit}
					</p>
				{/if}
			</div>
		{/snippet}
		<Chart
			{definition}
			ariaLabel="Daily weight and weekly averages over the last 12 months"
			height={320}
		/>
		<div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ash">
			<span>Weekly average:</span>
			<span class="flex items-center gap-2">
				<span class="w-5 border-t-[3px] border-good"></span> Decrease
			</span>
			<span class="flex items-center gap-2">
				<span class="w-5 border-t-[3px] border-red-600"></span> Increase
			</span>
			<span class="flex items-center gap-2">
				<span class="w-5 border-t-[3px] border-ash"></span> Unchanged
			</span>
		</div>
		<p class="mt-2 text-[13px] text-ash">
			Averages use logged daily weights; weeks without entries leave a gap.
		</p>
	</Panel>
{/if}
