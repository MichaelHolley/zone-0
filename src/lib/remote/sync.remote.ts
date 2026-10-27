import { command, query } from '$app/server';
import { syncStatus, syncStore } from '#lib/server/garmin/store.js';

export const getSyncStatus = query(() => syncStatus());

/** Called by the client after render, so pages show stored data without waiting on Garmin. */
export const syncWithGarmin = command(() => syncStore());
