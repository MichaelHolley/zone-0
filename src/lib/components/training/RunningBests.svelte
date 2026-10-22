<script lang="ts">
	import { formatClock, formatLongDate, formatPace, type MeasurementSystem } from '#lib/format.js';
	import { getRunningBests } from '#lib/remote/training.remote.js';
	import EmptyState from '#lib/components/EmptyState.svelte';

	let { system }: { system: MeasurementSystem } = $props();

	const bests = $derived(await getRunningBests());
</script>

{#if bests.length === 0}
	<EmptyState
		title="No running bests yet"
		description="Fastest splits appear here once you log runs."
	/>
{:else}
	<div class="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-zinc-200 text-left text-xs text-zinc-500">
					<th scope="col" class="px-4 py-2.5 font-normal">Distance</th>
					<th scope="col" class="px-4 py-2.5 text-right font-normal">Time</th>
					<th scope="col" class="px-4 py-2.5 text-right font-normal">Pace</th>
					<th scope="col" class="px-4 py-2.5 text-right font-normal">Date</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-zinc-100">
				{#each bests as best (best.meters)}
					<tr>
						<th scope="row" class="px-4 py-3 text-left font-medium">{best.label}</th>
						<td class="px-4 py-3 text-right font-mono tabular-nums">{formatClock(best.seconds)}</td>
						<td class="px-4 py-3 text-right font-mono tabular-nums">
							{formatPace(best.seconds, best.meters, system)}
						</td>
						<td class="px-4 py-3 text-right whitespace-nowrap text-zinc-500">
							{formatLongDate(best.date)}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
