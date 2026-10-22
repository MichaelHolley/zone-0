<script lang="ts">
	let { title, description }: { title: string; description: string } = $props();
</script>

<div class="rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-10 text-center">
	<p class="text-sm font-medium text-zinc-900">{title}</p>
	<p class="mt-1 text-sm text-zinc-500">{description}</p>
</div>
