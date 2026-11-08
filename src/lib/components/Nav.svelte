<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import BarbellIcon from 'phosphor-svelte/lib/BarbellIcon';
	import BicycleIcon from 'phosphor-svelte/lib/BicycleIcon';
	import ChartBarIcon from 'phosphor-svelte/lib/ChartBarIcon';
	import PersonSimpleRunIcon from 'phosphor-svelte/lib/PersonSimpleRunIcon';
	import { SPORT_COLOR } from '#lib/sport.js';

	const trainingHref = resolve('/training');

	const links = [
		{ href: resolve('/'), label: 'Today' },
		{ href: trainingHref, label: 'Training' },
		{ href: resolve('/body'), label: 'Body' }
	] as const;

	const sections = [
		{ id: 'overall', label: 'Overall', icon: ChartBarIcon, color: 'var(--color-ink)' },
		{ id: 'strength', label: 'Strength', icon: BarbellIcon, color: SPORT_COLOR.strength },
		{ id: 'cycling', label: 'Cycling', icon: BicycleIcon, color: SPORT_COLOR.cycling },
		{ id: 'running', label: 'Running', icon: PersonSimpleRunIcon, color: SPORT_COLOR.running }
	];

	let activeSection = $state('overall');

	function trackSections(list: HTMLElement) {
		const header = list.closest('header')!;
		let frame = 0;

		function updateActive() {
			frame = 0;
			const threshold = header.getBoundingClientRect().bottom + 32;
			let current = sections[0].id;

			for (const section of sections) {
				const target = document.getElementById(section.id);
				if (target && target.getBoundingClientRect().top <= threshold) current = section.id;
			}

			if (
				window.scrollY > 0 &&
				window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
			) {
				current = sections[sections.length - 1].id;
			}
			activeSection = current;
		}

		function scheduleUpdate() {
			if (!frame) frame = requestAnimationFrame(updateActive);
		}

		const observer = new ResizeObserver(scheduleUpdate);
		observer.observe(document.documentElement);
		window.addEventListener('scroll', scheduleUpdate, { passive: true });
		window.addEventListener('resize', scheduleUpdate);
		scheduleUpdate();

		return () => {
			observer.disconnect();
			cancelAnimationFrame(frame);
			window.removeEventListener('scroll', scheduleUpdate);
			window.removeEventListener('resize', scheduleUpdate);
		};
	}
</script>

<header class="sticky top-0 z-10 border-b border-line bg-white">
	<nav
		class="mx-auto flex h-20 max-w-6xl items-center justify-between gap-3 px-4 md:grid md:grid-cols-[1fr_auto_1fr] md:px-8"
	>
		<a href={resolve('/')} class="text-xl font-bold tracking-tight text-accent">zone-0</a>
		<ul
			class="flex items-center rounded-full border border-line-strong bg-white p-1 text-sm shadow-[0_1px_2px_rgb(0_0_0/0.08),0_4px_12px_rgb(0_0_0/0.05)]"
		>
			{#each links as link (link.href)}
				{@const active = page.url.pathname === link.href}
				{@const training = link.href === trainingHref}
				{@const expanded = active && training}
				<li
					class={[
						'flex items-center rounded-full transition-colors duration-200 motion-reduce:transition-none',
						active && 'bg-ink'
					]}
				>
					<div
						class={[
							'grid transition-[grid-template-columns] duration-200 motion-reduce:transition-none',
							expanded ? 'grid-cols-[0fr] sm:grid-cols-[1fr]' : 'grid-cols-[1fr]'
						]}
					>
						<a
							href={link.href}
							aria-current={active ? 'page' : undefined}
							class={[
								'min-w-0 overflow-hidden rounded-full font-semibold whitespace-nowrap transition-colors',
								active ? 'text-white' : 'text-ash hover:bg-mist hover:text-ink'
							]}
						>
							<span class="block px-3 py-2 sm:px-4">{link.label}</span>
						</a>
					</div>
					{#if training}
						<div
							inert={!expanded}
							class={[
								'grid transition-[grid-template-columns] duration-200 motion-reduce:transition-none',
								expanded ? 'grid-cols-[1fr]' : 'grid-cols-[0fr]'
							]}
						>
							<div class="min-w-0 overflow-hidden">
								<ul
									{@attach expanded && trackSections}
									aria-label="Training sections"
									class="flex items-center gap-0.5 p-0.5 sm:border-l sm:border-white/20 sm:pl-1.5"
								>
									{#each sections as section (section.id)}
										{@const current = activeSection === section.id}
										<li>
											<a
												href="#{section.id}"
												aria-label={section.label}
												title={section.label}
												aria-current={current ? 'location' : undefined}
												style:color={current ? section.color : undefined}
												class={[
													'flex size-8 items-center justify-center rounded-full transition-colors',
													current ? 'bg-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
												]}
											>
												<section.icon size={18} weight={current ? 'bold' : 'regular'} />
											</a>
										</li>
									{/each}
								</ul>
							</div>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	</nav>
</header>
