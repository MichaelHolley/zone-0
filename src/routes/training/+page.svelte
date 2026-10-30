<script lang="ts">
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Section from '#lib/components/Section.svelte';
	import SyncNotice from '#lib/components/SyncNotice.svelte';
	import Cycling from '#lib/components/training/Cycling.svelte';
	import IntensityLoad from '#lib/components/training/IntensityLoad.svelte';
	import Running from '#lib/components/training/Running.svelte';
	import Strength from '#lib/components/training/Strength.svelte';
	import WeeklyVolume from '#lib/components/training/WeeklyVolume.svelte';
	import { getProfile } from '#lib/remote/profile.remote.js';

	const profile = await getProfile();
</script>

<svelte:head><title>Training | zone-0</title></svelte:head>

<PageHeader title="Training" subtitle="Last 12 months" />
<SyncNotice timeZone={profile.timeZone} />

<div class="space-y-14">
	<Section title="Weekly volume" skeletonHeight={320}>
		<WeeklyVolume system={profile.measurementSystem} />
	</Section>

	<Section title="Intensity and load" skeletonHeight={440}>
		<IntensityLoad />
	</Section>

	<Section title="Strength" skeletonHeight={900}>
		<Strength />
	</Section>

	<Section title="Cycling" skeletonHeight={520}>
		<Cycling system={profile.measurementSystem} />
	</Section>

	<Section title="Running" skeletonHeight={480}>
		<Running system={profile.measurementSystem} />
	</Section>
</div>
