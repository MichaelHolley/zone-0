<script lang="ts">
	import { page } from '$app/state';

	const links = [
		{ href: '/', label: 'Today' },
		{ href: '/training', label: 'Training' },
		{ href: '/body', label: 'Body' }
	];
</script>

<header class="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
	<nav class="mx-auto flex h-14 max-w-6xl items-center gap-8 px-4 md:px-8">
		<a href="/" class="font-mono text-sm font-semibold tracking-tight text-zinc-900">zone-0</a>
		<ul class="flex h-full items-center gap-6 text-sm">
			{#each links as link (link.href)}
				{@const active = page.url.pathname === link.href}
				<li class="h-full">
					<a
						href={link.href}
						aria-current={active ? 'page' : undefined}
						class={[
							'flex h-full items-center border-b-2 transition-colors',
							active
								? 'border-accent font-medium text-zinc-900'
								: 'border-transparent text-zinc-500 hover:text-zinc-900'
						]}
					>
						{link.label}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
</header>
