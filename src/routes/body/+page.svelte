<script lang="ts">
	import Section from '#lib/components/Section.svelte';
	import WeightOverview from '#lib/components/body/WeightOverview.svelte';
	import { getProfile } from '#lib/remote/profile.remote.js';

	const profile = await getProfile();
</script>

<svelte:head><title>Body | zone-0</title></svelte:head>

<header class="mb-8">
	<h1 class="text-2xl font-semibold tracking-tight">Body</h1>
	<p class="mt-1 text-sm text-zinc-500">Last 12 months</p>
</header>

<Section skeletonHeight={480}>
	<WeightOverview system={profile.measurementSystem} />
</Section>
