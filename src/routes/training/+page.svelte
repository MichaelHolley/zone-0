<script lang="ts">
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Section from '#lib/components/Section.svelte';
	import SyncNotice from '#lib/components/SyncNotice.svelte';
	import Cycling from '#lib/components/training/Cycling.svelte';
	import IntensityLoad from '#lib/components/training/IntensityLoad.svelte';
	import Running from '#lib/components/training/Running.svelte';
	import Strength from '#lib/components/training/Strength.svelte';
	import WeeklyVolume from '#lib/components/training/WeeklyVolume.svelte';
	import TrainingNav from '#lib/components/training/TrainingNav.svelte';
	import { getProfile } from '#lib/remote/profile.remote.js';

	const profile = await getProfile();
</script>

<svelte:head><title>Training | zone-0</title></svelte:head>

<PageHeader title="Training" subtitle="Last 12 months" />
<SyncNotice timeZone={profile.timeZone} />

<TrainingNav />

<div class="space-y-14">
	<section id="overall" aria-label="Overall" tabindex="-1" class="scroll-mt-40 space-y-14">
		<Section title="Weekly volume" skeletonHeight={320}>
			<WeeklyVolume system={profile.measurementSystem} />
		</Section>

		<Section title="Intensity and load" skeletonHeight={440}>
			<IntensityLoad />
		</Section>
	</section>

	<Section id="strength" title="Strength" skeletonHeight={900} class="scroll-mt-40">
		<Strength />
	</Section>

	<Section id="cycling" title="Cycling" skeletonHeight={520} class="scroll-mt-40">
		<Cycling system={profile.measurementSystem} />
	</Section>

	<Section id="running" title="Running" skeletonHeight={480} class="scroll-mt-40">
		<Running system={profile.measurementSystem} />
	</Section>
</div>
