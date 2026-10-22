<script lang="ts">
	import Section from '#lib/components/Section.svelte';
	import FitnessAge from '#lib/components/body/FitnessAge.svelte';
	import WeightOverview from '#lib/components/body/WeightOverview.svelte';
	import { getProfile } from '#lib/remote/profile.remote.js';

	const profile = await getProfile();
</script>

<svelte:head><title>Body | zone-0</title></svelte:head>

<header class="mb-8">
	<h1 class="text-2xl font-semibold tracking-tight">Body</h1>
	<p class="mt-1 text-sm text-zinc-500">Last 12 months</p>
</header>

<div class="space-y-10">
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
