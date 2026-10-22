<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import KeyIcon from 'phosphor-svelte/lib/KeyIcon';
	import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
	import { errorMessage, isKeyError } from '#lib/errors.js';

	const keyError = $derived(isKeyError(page.error));
</script>

<svelte:head><title>{keyError ? 'API key rejected' : 'Error'} | zone-0</title></svelte:head>

<div class="max-w-xl pt-8">
	{#if keyError}
		<KeyIcon size={28} class="text-accent-ink" />
		<h1 class="mt-4 text-2xl font-semibold tracking-tight">Garmin rejected your API key</h1>
		<p class="mt-3 leading-relaxed text-zinc-600">
			The key in <code class="font-mono text-sm">GARMIN_API_KEY</code> is invalid or has expired. Create
			a new key in Garmin Connect, update your environment and restart the server.
		</p>
		<a
			href="https://connect.garmin.com/app/settings/personalApiToken"
			target="_blank"
			rel="noreferrer"
			class="mt-6 inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-zinc-800 active:translate-y-px"
		>
			Open Garmin API keys
		</a>
	{:else}
		<WarningCircleIcon size={28} class="text-red-600" />
		<h1 class="mt-4 text-2xl font-semibold tracking-tight">
			{page.status === 404 ? 'Page not found' : 'Something went wrong'}
		</h1>
		<p class="mt-3 leading-relaxed text-zinc-600">{errorMessage(page.error)}</p>
		<a
			href={resolve('/')}
			class="mt-6 inline-block text-sm font-medium text-accent-ink underline underline-offset-2"
		>
			Back to today
		</a>
	{/if}
</div>
