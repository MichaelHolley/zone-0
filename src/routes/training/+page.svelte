<script lang="ts">
	import Section from '#lib/components/Section.svelte';
	import Cycling from '#lib/components/training/Cycling.svelte';
	import IntensityLoad from '#lib/components/training/IntensityLoad.svelte';
	import RunningBests from '#lib/components/training/RunningBests.svelte';
	import WeeklyVolume from '#lib/components/training/WeeklyVolume.svelte';
	import { getProfile } from '#lib/remote/profile.remote.js';

	const profile = await getProfile();
</script>

<svelte:head><title>Training | zone-0</title></svelte:head>

<header class="mb-8">
	<h1 class="text-2xl font-semibold tracking-tight">Training</h1>
	<p class="mt-1 text-sm text-zinc-500">Last 12 months</p>
</header>

<div class="space-y-10">
	<Section title="Weekly volume" skeletonHeight={320}>
		<WeeklyVolume system={profile.measurementSystem} />
	</Section>

	<Section
		title="Intensity and load"
		description="Dashed line: weekly intensity goal"
		skeletonHeight={440}
	>
		<IntensityLoad />
	</Section>

	<Section title="Cycling" skeletonHeight={520}>
		<Cycling system={profile.measurementSystem} />
	</Section>

	<Section title="Running bests" skeletonHeight={280}>
		<RunningBests system={profile.measurementSystem} />
	</Section>
</div>
