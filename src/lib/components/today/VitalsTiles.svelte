<script lang="ts">
	import { Chart } from '@tanstack/charts/svelte';
	import Tile from '#lib/components/Tile.svelte';
	import { formatLongDate, formatNumber } from '#lib/format.js';
	import { getVitals } from '#lib/remote/today.remote.js';
	import { areaTrend, barTrend, lineTrend, rangeTrend } from './trends.js';

	let { today }: { today: string } = $props();

	const vitals = $derived(await getVitals());
	const trend = $derived(vitals.trend);

	const show = (value: number | null) => (value == null ? '-' : formatNumber(value));
	const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

	const restingDelta = $derived(
		vitals.restingHr.value != null && vitals.restingHr.sevenDayAvg != null
			? vitals.restingHr.value - vitals.restingHr.sevenDayAvg
			: null
	);
	const intensityShare = $derived(
		vitals.intensity.goal ? Math.round((vitals.intensity.week / vitals.intensity.goal) * 100) : null
	);

	const CHART_HEIGHT = 84;
</script>

{#if vitals.date !== today}
	<p class="mb-3 text-sm text-zinc-500">
		Nothing synced today yet. Showing {formatLongDate(vitals.date)}.
	</p>
{/if}

<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
	<Tile
		label="Resting heart rate"
		value={show(vitals.restingHr.value)}
		unit="bpm"
		class="md:col-span-2 xl:col-span-1"
	>
		{#snippet detail()}
			7-day avg {show(vitals.restingHr.sevenDayAvg)} bpm
			{#if restingDelta != null && restingDelta !== 0}
				<span class={restingDelta > 0 ? 'text-orange-700' : 'text-accent-ink'}>
					({signed(restingDelta)})
				</span>
			{/if}
		{/snippet}
		<Chart
			definition={lineTrend(trend, 'restingHr', 'bpm', vitals.restingHr.sevenDayAvg)}
			ariaLabel="Resting heart rate, last 28 days"
			height={CHART_HEIGHT}
		/>
	</Tile>

	<Tile label="Stress" value={show(vitals.stress.avg)} unit="avg">
		{#snippet detail()}Max {show(vitals.stress.max)}{/snippet}
		<Chart
			definition={barTrend(trend, 'stressAvg', 'avg stress')}
			ariaLabel="Average stress, last 28 days"
			height={CHART_HEIGHT}
		/>
	</Tile>

	<Tile label="Body battery" value={show(vitals.bodyBattery.latest)} unit="now">
		{#snippet detail()}
			High {show(vitals.bodyBattery.high)}, low {show(vitals.bodyBattery.low)}
			<br />
			Charged {show(vitals.bodyBattery.charged)}, drained {show(vitals.bodyBattery.drained)}
		{/snippet}
		<Chart
			definition={rangeTrend(trend)}
			ariaLabel="Body battery daily range, last 28 days"
			height={CHART_HEIGHT}
		/>
	</Tile>

	<Tile label="Intensity minutes" value={show(vitals.intensity.week)} unit="this week">
		{#snippet detail()}
			{#if vitals.intensity.goal}
				{intensityShare}% of {formatNumber(vitals.intensity.goal)} min goal
			{:else}
				No weekly goal set
			{/if}
		{/snippet}
		<Chart
			definition={barTrend(trend, 'intensity', 'min')}
			ariaLabel="Daily intensity minutes, last 28 days"
			height={CHART_HEIGHT}
		/>
	</Tile>

	<Tile label="Active calories" value={show(vitals.calories.active)} unit="kcal">
		{#snippet detail()}Total {show(vitals.calories.total)} kcal{/snippet}
		<Chart
			definition={areaTrend(trend, 'caloriesActive', 'kcal')}
			ariaLabel="Active calories, last 28 days"
			height={CHART_HEIGHT}
		/>
	</Tile>
</div>
