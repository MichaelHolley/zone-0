<script lang="ts">
	let { title, description }: { title: string; description: string } = $props();
</script>

<div class="rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center">
	<p class="font-semibold">{title}</p>
	<p class="mt-1 text-sm text-ash">{description}</p>
</div>
