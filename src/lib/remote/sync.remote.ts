import { query } from '$app/server';
import { syncStore } from '#lib/server/garmin/store.js';

export const getSyncStatus = query(() => syncStore());
