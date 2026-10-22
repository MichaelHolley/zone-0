<script lang="ts">
	import { Chart } from '@tanstack/charts/svelte';
	import { getIntensityAndLoad } from '#lib/remote/training.remote.js';
	import { EFFECTS, ZONES, effectChart, intensityChart, loadChart, zonesChart } from './charts.js';
	import Legend from '#lib/components/Legend.svelte';
	import Panel from '#lib/components/Panel.svelte';

	const data = $derived(await getIntensityAndLoad());

	const HEIGHT = 180;
</script>

<div class="grid gap-3 md:grid-cols-2">
	<Panel title="Heart rate time in zone">
		{#snippet aside()}<Legend items={ZONES} />{/snippet}
		<Chart
			definition={zonesChart(data.zones)}
			ariaLabel="Weekly hours in heart rate zones, last 12 months"
			height={HEIGHT}
		/>
	</Panel>

	<Panel title="Training load">
		<Chart
			definition={loadChart(data.load)}
			ariaLabel="Weekly training load, last 12 months"
			height={HEIGHT}
		/>
	</Panel>

	<Panel title="Intensity minutes">
		<Chart
			definition={intensityChart(data.intensity)}
			ariaLabel="Weekly intensity minutes against goal, last 12 months"
			height={HEIGHT}
		/>
	</Panel>

	<Panel title="Training effect">
		{#snippet aside()}<Legend items={EFFECTS} />{/snippet}
		<Chart
			definition={effectChart(data.trainingEffect)}
			ariaLabel="Average aerobic and anaerobic training effect per week, last 12 months"
			height={HEIGHT}
		/>
	</Panel>
</div>
