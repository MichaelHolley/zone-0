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
		<h1 class="mt-4 text-[2rem] leading-tight font-bold tracking-tight">
			Garmin rejected your API key
		</h1>
		<p class="mt-3 leading-relaxed text-ash">
			The key in <code class="text-sm">GARMIN_API_KEY</code> is invalid or has expired. Create a new key
			in Garmin Connect, update your environment and restart the server.
		</p>
		<a
			href="https://connect.garmin.com/app/settings/personalApiToken"
			target="_blank"
			rel="noreferrer"
			class="mt-6 inline-flex items-center rounded-lg bg-accent px-6 py-3 font-semibold text-white transition hover:bg-accent-ink active:scale-[0.98]"
		>
			Open Garmin API keys
		</a>
	{:else}
		<WarningCircleIcon size={28} class="text-red-600" />
		<h1 class="mt-4 text-[2rem] leading-tight font-bold tracking-tight">
			{page.status === 404 ? 'Page not found' : 'Something went wrong'}
		</h1>
		<p class="mt-3 leading-relaxed text-ash">{errorMessage(page.error)}</p>
		<a
			href={resolve('/')}
			class="mt-6 inline-block font-semibold text-ink underline underline-offset-2"
		>
			Back to today
		</a>
	{/if}
</div>
