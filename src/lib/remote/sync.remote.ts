import { command, query, requested } from '$app/server';
import { STORE_QUERIES } from '#lib/remote/store-queries.js';
import { syncStatus, syncStore } from '#lib/server/garmin/store.js';

export const getSyncStatus = query(() => syncStatus());

/** Called by the client after render, so pages show stored data without waiting on Garmin. */
export const syncWithGarmin = command(async () => {
	const synced = await syncStore();
	void getSyncStatus().refresh();
	await Promise.all(
		STORE_QUERIES.map((fn) =>
			synced ? requested(fn, 1).refreshAll() : requested(fn, 1).ignoreAll()
		)
	);
});
