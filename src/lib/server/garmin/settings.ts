import type { MeasurementSystem } from '#lib/format.js';
import { cached, HOUR } from './cache';
import { garmin, unwrap } from './client';
import { todayIn } from './dates';

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export type Settings = {
	measurementSystem: MeasurementSystem;
	timeZone: string;
	firstDayOfWeek: number;
};

function toMeasurementSystem(value: string | undefined): MeasurementSystem {
	return value === 'statute_us' || value === 'statute_uk' ? value : 'metric';
}

export function getSettings(): Promise<Settings> {
	return cached('settings', HOUR, async () => {
		const data = unwrap(await garmin.GET('/userprofile-service/userprofile/settings'));
		const dayIndex = WEEKDAYS.indexOf(data.firstDayOfWeek?.dayName?.toLowerCase() ?? '');
		return {
			measurementSystem: toMeasurementSystem(data.measurementSystem),
			timeZone: data.timeZone || 'UTC',
			firstDayOfWeek: dayIndex === -1 ? 1 : dayIndex
		};
	});
}

export async function getToday() {
	const settings = await getSettings();
	return { settings, today: todayIn(settings.timeZone) };
}
