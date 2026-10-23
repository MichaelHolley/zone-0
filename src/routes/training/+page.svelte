<script lang="ts">
	import Section from '#lib/components/Section.svelte';
	import Cycling from '#lib/components/training/Cycling.svelte';
	import IntensityLoad from '#lib/components/training/IntensityLoad.svelte';
	import Running from '#lib/components/training/Running.svelte';
	import Strength from '#lib/components/training/Strength.svelte';
	import WeeklyVolume from '#lib/components/training/WeeklyVolume.svelte';
	import { getProfile } from '#lib/remote/profile.remote.js';

	const profile = await getProfile();
</script>

<svelte:head><title>Training | zone-0</title></svelte:head>

<header class="mb-10">
	<h1 class="text-[2rem] leading-tight font-bold tracking-tight">Training</h1>
	<p class="mt-1 text-base text-ash">Last 12 months</p>
</header>

<div class="space-y-14">
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

	<Section
		title="Strength"
		description="Line: average of the last 10 sessions"
		skeletonHeight={900}
	>
		<Strength />
	</Section>

	<Section title="Cycling" skeletonHeight={520}>
		<Cycling system={profile.measurementSystem} />
	</Section>

	<Section title="Running" skeletonHeight={480}>
		<Running system={profile.measurementSystem} />
	</Section>
</div>
