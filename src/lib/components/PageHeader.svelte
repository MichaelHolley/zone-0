<script lang="ts">
	let { title, subtitle }: { title: string; subtitle: string } = $props();
</script>

<header class="mb-10">
	<h1 class="text-[2rem] leading-tight font-bold tracking-tight">{title}</h1>
	<p class="mt-1 text-base text-ash">{subtitle}</p>
</header>
