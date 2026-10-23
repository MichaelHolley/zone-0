<script lang="ts" generics="T extends string">
	let {
		options,
		value = $bindable(),
		label,
		ariaLabel
	}: {
		options: readonly T[];
		value: T;
		label: (option: T) => string;
		ariaLabel: string;
	} = $props();
</script>

<div role="group" aria-label={ariaLabel} class="flex flex-wrap gap-2">
	{#each options as option (option)}
		<button
			type="button"
			aria-pressed={value === option}
			onclick={() => (value = option)}
			class={[
				'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors active:scale-[0.97]',
				value === option
					? 'border-ink bg-ink text-white'
					: 'border-line-strong text-ink hover:border-ink'
			]}
		>
			{label(option)}
		</button>
	{/each}
</div>
