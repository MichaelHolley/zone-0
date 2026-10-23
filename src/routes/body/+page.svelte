<script lang="ts">
	import Section from '#lib/components/Section.svelte';
	import FitnessAge from '#lib/components/body/FitnessAge.svelte';
	import WeightOverview from '#lib/components/body/WeightOverview.svelte';
	import { getProfile } from '#lib/remote/profile.remote.js';

	const profile = await getProfile();
</script>

<svelte:head><title>Body | zone-0</title></svelte:head>

<header class="mb-10">
	<h1 class="text-[2rem] leading-tight font-bold tracking-tight">Body</h1>
	<p class="mt-1 text-base text-ash">Last 12 months</p>
</header>

<div class="space-y-14">
	<Section skeletonHeight={480}>
		<WeightOverview system={profile.measurementSystem} />
	</Section>

	<Section
		title="Fitness age"
		description="Estimated from vigorous activity, resting heart rate and BMI"
		skeletonHeight={280}
	>
		<FitnessAge />
	</Section>
</div>
