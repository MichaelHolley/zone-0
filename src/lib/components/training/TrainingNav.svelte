<script lang="ts">
	const sections = [
		{ id: 'overall', label: 'Overall' },
		{ id: 'strength', label: 'Strength' },
		{ id: 'cycling', label: 'Cycling' },
		{ id: 'running', label: 'Running' }
	];

	let active = $state('overall');

	function trackSections(nav: HTMLElement) {
		const targets = sections.map((section) => document.getElementById(section.id));
		let frame = 0;

		function updateActive() {
			frame = 0;
			const threshold = nav.getBoundingClientRect().bottom + 32;
			let current = sections[0].id;

			for (const [index, target] of targets.entries()) {
				if (target && target.getBoundingClientRect().top <= threshold) {
					current = sections[index].id;
				}
			}

			if (
				window.scrollY > 0 &&
				window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
			) {
				current = sections[sections.length - 1].id;
			}
			active = current;
		}

		function scheduleUpdate() {
			if (!frame) frame = requestAnimationFrame(updateActive);
		}

		const observer = new ResizeObserver(scheduleUpdate);
		for (const target of targets) {
			if (target) observer.observe(target);
		}
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

<nav
	{@attach trackSections}
	aria-label="Training sections"
	class="sticky top-(--app-header-height) z-20 mb-8 bg-white py-3"
>
	<ul
		class="grid grid-cols-4 gap-1 border-b border-line-strong bg-mist px-3 sm:flex sm:gap-8 sm:px-4"
	>
		{#each sections as section (section.id)}
			<li>
				<a
					href="#{section.id}"
					aria-current={active === section.id ? 'location' : undefined}
					class={[
						'group -mb-px block text-center text-sm font-semibold',
						active === section.id ? 'text-ink' : 'text-ash hover:text-ink'
					]}
				>
					<span
						class={[
							'inline-block border-b-2 py-3',
							active === section.id
								? 'border-ink'
								: 'border-transparent group-hover:border-line-strong'
						]}
					>
						{section.label}
					</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>
