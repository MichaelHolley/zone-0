<script lang="ts">
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Section from '#lib/components/Section.svelte';
	import FitnessAge from '#lib/components/body/FitnessAge.svelte';
	import WeightOverview from '#lib/components/body/WeightOverview.svelte';
	import { getProfile } from '#lib/remote/profile.remote.js';

	const profile = await getProfile();
</script>

<svelte:head><title>Body | zone-0</title></svelte:head>

<PageHeader title="Body" subtitle="Last 12 months" />

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
		<p class="mt-3 text-sm text-ash">
			Vigorous activity is exercise intense enough that you can only say a few words before pausing
			for breath, such as running or fast cycling. Garmin estimates it from your heart rate.
		</p>
	</Section>
</div>
