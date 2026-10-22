import { query } from '$app/server';
import { getToday } from '#lib/server/garmin/settings.js';

export const getProfile = query(async () => {
	const { settings, today } = await getToday();
	return { ...settings, today };
});
