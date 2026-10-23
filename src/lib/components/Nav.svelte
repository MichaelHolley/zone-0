<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const links = [
		{ href: resolve('/'), label: 'Today' },
		{ href: resolve('/training'), label: 'Training' },
		{ href: resolve('/body'), label: 'Body' }
	] as const;
</script>

<header class="sticky top-0 z-10 border-b border-line bg-white">
	<nav
		class="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 md:grid md:grid-cols-[1fr_auto_1fr] md:px-8"
	>
		<a href={resolve('/')} class="text-xl font-bold tracking-tight text-accent">zone-0</a>
		<ul
			class="flex items-center rounded-full border border-line-strong bg-white p-1 text-sm shadow-[0_1px_2px_rgb(0_0_0/0.08),0_4px_12px_rgb(0_0_0/0.05)]"
		>
			{#each links as link (link.href)}
				{@const active = page.url.pathname === link.href}
				<li>
					<a
						href={link.href}
						aria-current={active ? 'page' : undefined}
						class={[
							'block rounded-full px-4 py-2 font-semibold transition-colors',
							active ? 'bg-ink text-white' : 'text-ash hover:bg-mist hover:text-ink'
						]}
					>
						{link.label}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
</header>
