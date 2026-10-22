<script lang="ts">
	import { Chart } from '@tanstack/charts/svelte';
	import { getPowerCurve } from '#lib/remote/training.remote.js';
	import { powerChart } from './charts.js';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Panel from '#lib/components/Panel.svelte';

	const rows = $derived(await getPowerCurve());
</script>

{#if rows.length === 0}
	<EmptyState
		title="No power data yet"
		description="Rides recorded with a power meter appear here."
	/>
{:else}
	<Panel>
		<Chart
			definition={powerChart(rows)}
			ariaLabel="Cycling power curve, best average watts by duration"
			height={240}
		/>
	</Panel>
{/if}
