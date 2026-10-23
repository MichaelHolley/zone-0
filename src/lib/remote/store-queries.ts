import type { RemoteQueryFunction } from '$app/server';
import { getVitals, getWeekWorkouts } from '#lib/remote/today.remote.js';
import {
	getCycling,
	getIntensityAndLoad,
	getRunning,
	getRunningBests,
	getStrength,
	getWeeklyVolume
} from '#lib/remote/training.remote.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the queries return different shapes
export const STORE_QUERIES: RemoteQueryFunction<void, any>[] = [
	getVitals,
	getWeekWorkouts,
	getWeeklyVolume,
	getIntensityAndLoad,
	getRunningBests,
	getStrength,
	getRunning,
	getCycling
];
