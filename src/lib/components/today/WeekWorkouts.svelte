<script lang="ts">
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
	<div class="rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-10 text-center">
		<p class="text-sm font-medium text-zinc-900">No workouts yet this week</p>
		<p class="mt-1 text-sm text-zinc-500">Activities appear here once your watch syncs.</p>
	</div>
{:else}
	<div class="rounded-lg border border-zinc-200 bg-white">
		<p class="border-b border-zinc-200 px-4 py-2.5 text-xs text-zinc-500">
			{workouts.length}
			{workouts.length === 1 ? 'workout' : 'workouts'}, {formatDuration(totalDuration)} total
		</p>
		<ul class="divide-y divide-zinc-100">
			{#each workouts as workout (workout.id)}
				<li
					class="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 md:grid-cols-[auto_minmax(0,1fr)_5rem_5.5rem_4.5rem_9rem]"
				>
					<SportIcon sport={workout.sport} />
					<div class="min-w-0">
						<p class="truncate text-sm font-medium">{workout.name}</p>
						<p class="text-xs text-zinc-500">{formatDay(workout.date)}</p>
					</div>
					<p class="text-right font-mono text-sm tabular-nums">
						{formatDuration(workout.duration)}
					</p>
					<p
						class="col-start-2 font-mono text-xs text-zinc-500 tabular-nums md:col-start-auto md:text-right md:text-sm md:text-zinc-900"
					>
						{workout.distance ? formatDistance(workout.distance, system) : ''}
					</p>
					<p class="hidden text-right font-mono text-sm tabular-nums md:block">
						{#if workout.averageHr}
							{Math.round(workout.averageHr)}<span class="text-xs text-zinc-500"> bpm</span>
						{/if}
					</p>
					<p
						class="col-span-2 col-start-2 text-xs text-zinc-500 md:col-span-1 md:col-start-auto md:text-right"
					>
						{workout.trainingEffect ? effectLabel(workout.trainingEffect) : ''}
					</p>
				</li>
			{/each}
		</ul>
	</div>
{/if}
