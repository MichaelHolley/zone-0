<script lang="ts">
	import PersonSimpleRunIcon from 'phosphor-svelte/lib/PersonSimpleRunIcon';
	import BicycleIcon from 'phosphor-svelte/lib/BicycleIcon';
	import BarbellIcon from 'phosphor-svelte/lib/BarbellIcon';
	import PulseIcon from 'phosphor-svelte/lib/PulseIcon';
	import { SPORT_COLOR, SPORT_LABEL, type Sport } from '#lib/sport.js';

	let { sport, size = 16 }: { sport: Sport; size?: number } = $props();

	const icons = {
		running: PersonSimpleRunIcon,
		cycling: BicycleIcon,
		strength: BarbellIcon,
		other: PulseIcon
	};
	const Icon = $derived(icons[sport]);
</script>

<span
	class="inline-flex size-9 shrink-0 items-center justify-center rounded-full"
	style:color={SPORT_COLOR[sport]}
	style:background-color="{SPORT_COLOR[sport]}1a"
	title={SPORT_LABEL[sport]}
>
	<Icon {size} weight="bold" />
</span>
