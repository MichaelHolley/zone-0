<script lang="ts">
	import Cell from '#lib/components/Cell.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import RowHeader from '#lib/components/RowHeader.svelte';
	import Table from '#lib/components/Table.svelte';
	import Tile from '#lib/components/Tile.svelte';
	import { formatNumber, orDash } from '#lib/format.js';
	import { getFitnessAge } from '#lib/remote/body.remote.js';

	const columns = [
		{ label: 'Factor' },
		{ label: 'Current', end: true },
		{ label: 'Target', end: true },
		{ label: 'Age at target', end: true }
	];

	const fitnessAge = $derived(await getFitnessAge());
</script>

{#if !fitnessAge}
	<EmptyState
		title="No fitness age yet"
		description="Garmin needs your age and some recent activity to estimate it."
	/>
{:else}
	<div class="grid gap-3 sm:grid-cols-2">
		<Tile label="Fitness age" value={formatNumber(fitnessAge.fitnessAge, 1)} unit="years">
			{#snippet detail()}
				{#if fitnessAge.chronologicalAge != null}
					<span class={{ 'text-good': fitnessAge.fitnessAge < fitnessAge.chronologicalAge }}>
						{formatNumber(Math.abs(fitnessAge.chronologicalAge - fitnessAge.fitnessAge), 1)}
					</span>
					years
					{fitnessAge.fitnessAge <= fitnessAge.chronologicalAge ? 'younger' : 'older'} than your actual
					age of {fitnessAge.chronologicalAge}
				{/if}
			{/snippet}
		</Tile>
		{#if fitnessAge.achievableAge != null}
			<Tile
				label="Achievable fitness age"
				value={formatNumber(fitnessAge.achievableAge, 1)}
				positive={fitnessAge.achievableAge < fitnessAge.fitnessAge}
				unit="years"
			>
				{#snippet detail()}Best possible with these factors{/snippet}
			</Tile>
		{/if}
	</div>

	{#if fitnessAge.components.length > 0}
		<div class="mt-3">
			<Table {columns}>
				{#each fitnessAge.components as component (component.key)}
					{@const targetImproves =
						component.target != null &&
						(component.key === 'bmi' || component.key === 'rhr'
							? component.target < component.value
							: component.target > component.value)}
					<tr>
						<RowHeader>{component.label}</RowHeader>
						<Cell numeric>
							{formatNumber(component.value, 1)}
							{component.unit}
						</Cell>
						<Cell numeric class={targetImproves ? 'text-good' : undefined}>
							{orDash(component.target, (target) => `${formatNumber(target, 1)} ${component.unit}`)}
						</Cell>
						<Cell
							numeric
							class={component.potentialAge != null &&
							component.potentialAge < fitnessAge.fitnessAge
								? 'text-good'
								: undefined}
						>
							{orDash(component.potentialAge, (age) => formatNumber(age, 1))}
						</Cell>
					</tr>
				{/each}
			</Table>
		</div>
	{/if}
{/if}
