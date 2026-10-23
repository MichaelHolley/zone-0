<script lang="ts">
	import Section from '#lib/components/Section.svelte';
	import VitalsTiles from '#lib/components/today/VitalsTiles.svelte';
	import WeekWorkouts from '#lib/components/today/WeekWorkouts.svelte';
	import { formatLongDate } from '#lib/format.js';
	import { getProfile } from '#lib/remote/profile.remote.js';

	const profile = await getProfile();
</script>

<svelte:head><title>Today | zone-0</title></svelte:head>

<header class="mb-10">
	<h1 class="text-[2rem] leading-tight font-bold tracking-tight">Today</h1>
	<p class="mt-1 text-base text-ash">{formatLongDate(profile.today)}</p>
</header>

<div class="space-y-14">
	<Section
		title="Vitals"
		description="Today's values with the last 4 weeks below"
		skeletonHeight={232}
	>
		<VitalsTiles today={profile.today} />
	</Section>

	<Section title="This week" skeletonHeight={180}>
		<WeekWorkouts system={profile.measurementSystem} />
	</Section>
</div>
