<script lang="ts">
	import { Chart } from '@tanstack/charts/svelte';
	import Tile from '#lib/components/Tile.svelte';
	import { formatLongDate, formatNumber, orDash } from '#lib/format.js';
	import { getVitals } from '#lib/remote/today.remote.js';
	import { areaTrend, barTrend, heartRateTrend, lineTrend, rangeTrend } from './trends.js';

	let { today }: { today: string } = $props();

	const vitals = $derived(await getVitals());
	const trend = $derived(vitals.trend);

	const show = (value: number | null) => orDash(value, formatNumber);
	const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

	const restingDelta = $derived(
		vitals.restingHr.value != null && vitals.restingHr.sevenDayAvg != null
			? vitals.restingHr.value - vitals.restingHr.sevenDayAvg
			: null
	);
	const intensityShare = $derived(
		vitals.intensity.goal ? Math.round((vitals.intensity.week / vitals.intensity.goal) * 100) : null
	);

	const CHART_HEIGHT = 112;
</script>

{#if vitals.date !== today}
	<p class="mb-3 text-sm text-ash">
		Nothing synced today yet. Showing {formatLongDate(vitals.date)}.
	</p>
{/if}

<div class="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
	<Tile
		label="Resting heart rate"
		value={show(vitals.restingHr.value)}
		unit="bpm"
		class="md:col-span-2 lg:col-span-2"
	>
		{#snippet detail()}
			7-day avg {show(vitals.restingHr.sevenDayAvg)} bpm
			{#if restingDelta != null && restingDelta !== 0}
				<span class={restingDelta > 0 ? 'text-accent-ink' : 'text-good'}>
					({signed(restingDelta)})
				</span>
			{/if}
			<br />
			Low {show(vitals.restingHr.low)}, high {show(vitals.restingHr.high)} bpm
		{/snippet}
		<Chart
			definition={heartRateTrend(trend, vitals.restingHr.sevenDayAvg)}
			ariaLabel="Resting heart rate with daily low and high, last 28 days"
			height={CHART_HEIGHT}
		/>
	</Tile>

	<Tile label="Stress" value={show(vitals.stress.avg)} unit="avg" class="lg:col-span-2">
		{#snippet detail()}Max {show(vitals.stress.max)}{/snippet}
		<Chart
			definition={barTrend(trend, 'stressAvg', 'avg stress')}
			ariaLabel="Average stress, last 28 days"
			height={CHART_HEIGHT}
		/>
	</Tile>

	<Tile
		label="Body battery"
		value={show(vitals.bodyBattery.latest)}
		unit="now"
		class="lg:col-span-2"
	>
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

	<Tile
		label="Intensity minutes"
		value={show(vitals.intensity.week)}
		unit="this week"
		class="lg:col-span-2"
	>
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

	<Tile
		label="Active calories"
		value={show(vitals.calories.active)}
		unit="kcal"
		class="lg:col-span-2"
	>
		{#snippet detail()}Total {show(vitals.calories.total)} kcal{/snippet}
		<Chart
			definition={areaTrend(trend, 'caloriesActive', 'kcal')}
			ariaLabel="Active calories, last 28 days"
			height={CHART_HEIGHT}
		/>
	</Tile>

	<Tile
		label="Respiration"
		value={show(vitals.respiration.avg)}
		unit="breaths/min"
		class="lg:col-span-2"
	>
		{#snippet detail()}
			Low {show(vitals.respiration.low)}, high {show(vitals.respiration.high)}
		{/snippet}
		<Chart
			definition={lineTrend(trend, 'respiration', 'breaths/min')}
			ariaLabel="Average respiration, last 28 days"
			height={CHART_HEIGHT}
		/>
	</Tile>
</div>
