import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	GARMIN_API_KEY: {
		description: 'Garmin Connect Personal API key, exchanged for short-lived access tokens',
		schema: (value) => value?.trim() || undefined
	}
});
