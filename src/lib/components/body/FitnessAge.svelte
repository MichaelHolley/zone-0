<script lang="ts">
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Tile from '#lib/components/Tile.svelte';
	import { formatNumber } from '#lib/format.js';
	import { getFitnessAge } from '#lib/remote/body.remote.js';

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
					{formatNumber(Math.abs(fitnessAge.chronologicalAge - fitnessAge.fitnessAge), 1)} years
					{fitnessAge.fitnessAge <= fitnessAge.chronologicalAge ? 'younger' : 'older'} than your actual
					age of {fitnessAge.chronologicalAge}
				{/if}
			{/snippet}
		</Tile>
		{#if fitnessAge.achievableAge != null}
			<Tile
				label="Achievable fitness age"
				value={formatNumber(fitnessAge.achievableAge, 1)}
				unit="years"
			>
				{#snippet detail()}Best possible with these factors{/snippet}
			</Tile>
		{/if}
	</div>

	{#if fitnessAge.components.length > 0}
		<div class="mt-3 overflow-x-auto rounded-2xl border border-line bg-white">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-line text-left text-[13px] text-ash">
						<th scope="col" class="px-5 py-3 font-medium">Factor</th>
						<th scope="col" class="px-5 py-3 text-right font-medium">Current</th>
						<th scope="col" class="px-5 py-3 text-right font-medium">Target</th>
						<th scope="col" class="px-5 py-3 text-right font-medium">Age at target</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-line">
					{#each fitnessAge.components as component (component.label)}
						<tr>
							<th scope="row" class="px-5 py-3.5 text-left font-medium">{component.label}</th>
							<td class="px-5 py-3.5 text-right tabular-nums">
								{formatNumber(component.value, 1)}
								{component.unit}
							</td>
							<td class="px-5 py-3.5 text-right tabular-nums">
								{component.target == null
									? '-'
									: `${formatNumber(component.target, 1)} ${component.unit}`}
							</td>
							<td class="px-5 py-3.5 text-right tabular-nums">
								{component.potentialAge == null ? '-' : formatNumber(component.potentialAge, 1)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
{/if}
