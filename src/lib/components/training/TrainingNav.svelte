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
	class="sticky top-20 z-10 mb-8 border-b border-line bg-white"
>
	<ul class="grid grid-cols-4 gap-1 sm:flex sm:gap-8">
		{#each sections as section (section.id)}
			<li>
				<a
					href="#{section.id}"
					aria-current={active === section.id ? 'location' : undefined}
					class={[
						'block border-b-2 px-1 py-4 text-center text-sm font-semibold sm:px-0',
						active === section.id
							? 'border-ink text-ink'
							: 'border-transparent text-ash hover:border-line-strong hover:text-ink'
					]}
				>
					{section.label}
				</a>
			</li>
		{/each}
	</ul>
</nav>
