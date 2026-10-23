<script lang="ts">
	import EmptyState from '#lib/components/EmptyState.svelte';
	import SportIcon from '#lib/components/SportIcon.svelte';
	import {
		formatDay,
		formatDistance,
		formatDuration,
		type MeasurementSystem
	} from '#lib/format.js';
	import { getWeekWorkouts } from '#lib/remote/today.remote.js';

	let { system }: { system: MeasurementSystem } = $props();

	const workouts = $derived(await getWeekWorkouts());
	const totalDuration = $derived(workouts.reduce((sum, w) => sum + w.duration, 0));

	const effectLabel = (label: string) => {
		const text = label.toLowerCase().replaceAll('_', ' ');
		return text.charAt(0).toUpperCase() + text.slice(1);
	};
</script>

{#if workouts.length === 0}
	<EmptyState
		title="No workouts yet this week"
		description="Activities appear here once your watch syncs."
	/>
{:else}
	<div class="rounded-2xl border border-line bg-white">
		<p class="border-b border-line px-5 py-3.5 text-sm font-medium text-ash">
			{workouts.length}
			{workouts.length === 1 ? 'workout' : 'workouts'}, {formatDuration(totalDuration)} total
		</p>
		<ul class="divide-y divide-line">
			{#each workouts as workout (workout.id)}
				<li
					class="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3.5 md:grid-cols-[auto_minmax(0,1fr)_5rem_5.5rem_4.5rem_9rem]"
				>
					<SportIcon sport={workout.sport} />
					<div class="min-w-0">
						<p class="truncate text-[15px] font-semibold">{workout.name}</p>
						<p class="text-[13px] text-ash">{formatDay(workout.date)}</p>
					</div>
					<p class="text-right text-sm tabular-nums">
						{formatDuration(workout.duration)}
					</p>
					<p
						class="col-start-2 text-[13px] text-ash tabular-nums md:col-start-auto md:text-right md:text-sm md:text-ink"
					>
						{workout.distance ? formatDistance(workout.distance, system) : ''}
					</p>
					<p class="hidden text-right text-sm tabular-nums md:block">
						{#if workout.averageHr}
							{Math.round(workout.averageHr)} <span class="text-[13px] text-ash">bpm</span>
						{/if}
					</p>
					<p
						class="col-span-2 col-start-2 text-[13px] text-ash md:col-span-1 md:col-start-auto md:text-right"
					>
						{workout.trainingEffect ? effectLabel(workout.trainingEffect) : ''}
					</p>
				</li>
			{/each}
		</ul>
	</div>
{/if}
