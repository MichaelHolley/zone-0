<script lang="ts">
	import { Chart } from '@tanstack/charts/svelte';
	import type { MeasurementSystem } from '#lib/format.js';
	import { getWeeklyVolume } from '#lib/remote/training.remote.js';
	import { SPORT_COLOR, SPORT_LABEL } from '#lib/sport.js';
	import {
		METRICS,
		METRIC_LABEL,
		sportsWithData,
		volumeChart,
		volumeRows,
		type VolumeMetric
	} from './charts.js';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Legend from '#lib/components/Legend.svelte';
	import Panel from '#lib/components/Panel.svelte';

	let { system }: { system: MeasurementSystem } = $props();

	const data = $derived(await getWeeklyVolume());
	let metric = $state<VolumeMetric>('duration');

	const rows = $derived(volumeRows(data, metric, system));
	const sports = $derived(sportsWithData(rows));
	const legend = $derived(
		sports.map((sport) => ({ label: SPORT_LABEL[sport], color: SPORT_COLOR[sport] }))
	);
</script>

<Panel>
	<div class="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
		<div role="group" aria-label="Volume metric" class="inline-flex rounded-md bg-zinc-100 p-0.5">
			{#each METRICS as option (option)}
				<button
					type="button"
					aria-pressed={metric === option}
					onclick={() => (metric = option)}
					class={[
						'rounded px-2.5 py-1 text-xs font-medium transition-colors active:translate-y-px',
						metric === option
							? 'bg-white text-zinc-900 shadow-sm'
							: 'text-zinc-500 hover:text-zinc-900'
					]}
				>
					{METRIC_LABEL[option]}
				</button>
			{/each}
		</div>
		<Legend items={legend} />
	</div>
	{#if sports.length === 0}
		<EmptyState
			title="No {METRIC_LABEL[metric].toLowerCase()} recorded"
			description="Nothing to show for this metric in the last 12 months."
		/>
	{:else}
		<Chart
			definition={volumeChart(rows, metric, system)}
			ariaLabel="Weekly {METRIC_LABEL[metric].toLowerCase()} by sport, last 12 months"
			height={240}
		/>
	{/if}
</Panel>
