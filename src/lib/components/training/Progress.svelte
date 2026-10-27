<script lang="ts">
	import { Chart } from '@tanstack/charts/svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Legend from '#lib/components/Legend.svelte';
	import Panel from '#lib/components/Panel.svelte';
	import {
		distanceUnit,
		formatClock,
		formatNumber,
		speedUnit,
		type MeasurementSystem
	} from '#lib/format.js';
	import { getProgress } from '#lib/remote/training.remote.js';
	import { SPORT_COLOR } from '#lib/sport.js';
	import {
		RIDE_SYMBOLS,
		RUN_SYMBOLS,
		progressChart,
		progressTrend,
		rideProgress,
		runProgress
	} from './charts.js';

	let { system }: { system: MeasurementSystem } = $props();

	const { cycling, running, restingHr } = $derived(await getProgress());
	const rides = $derived(
		cycling.referenceHr == null ? [] : rideProgress(cycling.efforts, cycling.referenceHr, system)
	);
	const runs = $derived(
		running.referenceHr == null ? [] : runProgress(running.efforts, running.referenceHr, system)
	);
	const rideTrend = $derived(progressTrend(rides));
	const runTrend = $derived(progressTrend(runs));

	const monthFormat = new Intl.DateTimeFormat('en-GB', {
		month: 'short',
		year: 'numeric',
		timeZone: 'UTC'
	});
</script>

{#snippet trendLine(since: Date, change: string, improved: boolean)}
	<p class="mb-3 text-sm text-ash">
		<span class={['font-semibold', improved ? 'text-good' : 'text-accent-ink']}>{change}</span>
		since {monthFormat.format(since)}
	</p>
{/snippet}

{#snippet formula(text: string, explanation: string)}
	<p class="mt-4 text-[13px] leading-snug text-ash">
		<span class="font-medium text-ink tabular-nums">{text}</span><br />{explanation}
	</p>
{/snippet}

<div class="grid gap-3 md:grid-cols-2">
	<Panel
		title={cycling.referenceHr == null
			? 'Cycling'
			: `Cycling speed at ${cycling.referenceHr} bpm (${speedUnit(system)})`}
	>
		{#snippet aside()}<Legend items={RIDE_SYMBOLS} />{/snippet}
		{#if rides.length === 0}
			<EmptyState
				title="No rides to compare"
				description="Outdoor rides with heart rate from the last 12 months appear here."
			/>
		{:else}
			{#if rideTrend}
				{@const change = rideTrend.to - rideTrend.from}
				{@render trendLine(
					rideTrend.since,
					`${change >= 0 ? '+' : '−'}${formatNumber(Math.abs(change), 1)} ${speedUnit(system)}`,
					change >= 0
				)}
			{/if}
			<Chart
				definition={progressChart(rides, { color: SPORT_COLOR.cycling, hollowKind: 'Road' })}
				ariaLabel="Climb-adjusted speed of each outdoor ride scaled to the same heart rate, with a 12-month trend line, gravel as filled circles and road as rings"
				height={200}
			/>
			{@render formula(
				`(distance + 10 × climb) ÷ moving time × ∛((${cycling.referenceHr} − ${restingHr}) ÷ (avg HR − ${restingHr}))`,
				`Climbing counts ten times its height as flat distance. Speed is scaled to ${cycling.referenceHr} bpm, your typical ride heart rate, by the cube root because air drag makes power grow with the cube of speed. ${restingHr} bpm is your median resting heart rate.`
			)}
		{/if}
	</Panel>

	<Panel
		title={running.referenceHr == null
			? 'Running'
			: `Running pace at ${running.referenceHr} bpm (min/${distanceUnit(system)})`}
	>
		{#snippet aside()}<Legend items={RUN_SYMBOLS} />{/snippet}
		{#if runs.length === 0}
			<EmptyState
				title="No runs to compare"
				description="Runs with heart rate from the last 12 months appear here."
			/>
		{:else}
			{#if runTrend}
				{@const faster = runTrend.from - runTrend.to}
				{@render trendLine(
					runTrend.since,
					`${formatClock(Math.abs(faster))} /${distanceUnit(system)} ${faster >= 0 ? 'faster' : 'slower'}`,
					faster >= 0
				)}
			{/if}
			<Chart
				definition={progressChart(runs, {
					color: SPORT_COLOR.running,
					hollowKind: 'Treadmill',
					pace: true
				})}
				ariaLabel="Grade-adjusted pace of each run scaled to the same heart rate, faster pace higher, with a 12-month trend line, treadmill runs as rings"
				height={200}
			/>
			{@render formula(
				`grade-adjusted speed × (${running.referenceHr} − ${restingHr}) ÷ (avg HR − ${restingHr})`,
				`Garmin's grade-adjusted speed accounts for hills. Speed is scaled linearly to ${running.referenceHr} bpm, your typical running heart rate, because running effort grows in step with speed.`
			)}
		{/if}
	</Panel>
</div>
