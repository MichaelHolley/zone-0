<script lang="ts">
	import { Chart } from '@tanstack/charts/svelte';
	import { getVo2Max } from '#lib/remote/training.remote.js';
	import { SPORT_COLOR, SPORT_LABEL } from '#lib/sport.js';
	import { vo2Chart } from './charts.js';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Legend from '#lib/components/Legend.svelte';
	import Panel from '#lib/components/Panel.svelte';

	const rows = $derived(await getVo2Max());
	const legend = $derived(
		(['running', 'cycling'] as const)
			.filter((sport) => rows.some((row) => row.sport === sport))
			.map((sport) => ({ label: SPORT_LABEL[sport], color: SPORT_COLOR[sport] }))
	);
</script>

{#if rows.length === 0}
	<EmptyState
		title="No VO2max values yet"
		description="Running or cycling activities with a VO2max estimate appear here."
	/>
{:else}
	<Panel>
		<div class="mb-3"><Legend items={legend} /></div>
		<Chart definition={vo2Chart(rows)} ariaLabel="VO2max over the last 12 months" height={200} />
	</Panel>
{/if}
