<script lang="ts">
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Section from '#lib/components/Section.svelte';
	import SyncNotice from '#lib/components/SyncNotice.svelte';
	import VitalsTiles from '#lib/components/pulse/VitalsTiles.svelte';
	import RecentWorkouts from '#lib/components/pulse/RecentWorkouts.svelte';
	import { formatLongDate } from '#lib/format.js';
	import { getProfile } from '#lib/remote/profile.remote.js';

	const profile = await getProfile();
</script>

<svelte:head><title>Pulse | zone-0</title></svelte:head>

<PageHeader title="Pulse" subtitle={formatLongDate(profile.today)} />
<SyncNotice timeZone={profile.timeZone} />

<div class="space-y-14">
	<Section
		title="Vitals"
		description="Today's values with the last 4 weeks below"
		skeletonHeight={560}
	>
		<VitalsTiles today={profile.today} />
	</Section>

	<Section title="Past 7 days" skeletonHeight={180}>
		<RecentWorkouts system={profile.measurementSystem} />
	</Section>
</div>
