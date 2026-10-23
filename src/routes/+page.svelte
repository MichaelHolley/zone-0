<script lang="ts">
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Section from '#lib/components/Section.svelte';
	import VitalsTiles from '#lib/components/today/VitalsTiles.svelte';
	import WeekWorkouts from '#lib/components/today/WeekWorkouts.svelte';
	import { formatLongDate } from '#lib/format.js';
	import { getProfile } from '#lib/remote/profile.remote.js';

	const profile = await getProfile();
</script>

<svelte:head><title>Today | zone-0</title></svelte:head>

<PageHeader title="Today" subtitle={formatLongDate(profile.today)} />

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
