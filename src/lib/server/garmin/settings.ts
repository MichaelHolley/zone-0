import { isKeyError } from '#lib/errors.js';
import type { MeasurementSystem } from '#lib/format.js';
import { cached, HOUR } from './cache';
import { garmin, unwrap } from './client';
import { todayIn } from './dates';
import { database } from './db';

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export type Settings = {
	measurementSystem: MeasurementSystem;
	timeZone: string;
	firstDayOfWeek: number;
};

function toMeasurementSystem(value: string | undefined): MeasurementSystem {
	return value === 'statute_us' || value === 'statute_uk' ? value : 'metric';
}

async function fetchSettings(): Promise<Settings> {
	const data = unwrap(await garmin.GET('/userprofile-service/userprofile/settings'));
	const dayIndex = WEEKDAYS.indexOf(data.firstDayOfWeek?.dayName?.toLowerCase() ?? '');
	return {
		measurementSystem: toMeasurementSystem(data.measurementSystem),
		timeZone: data.timeZone || 'UTC',
		firstDayOfWeek: dayIndex === -1 ? 1 : dayIndex
	};
}

function storedSettings(): Settings | null {
	const row = database().prepare('SELECT json FROM settings WHERE id = 1').get();
	return row ? JSON.parse(String(row.json)) : null;
}

/** Falls back to the last stored settings so pages can still render stored data while Garmin is down. */
export function getSettings(): Promise<Settings> {
	return cached('settings', HOUR, async () => {
		try {
			const settings = await fetchSettings();
			database()
				.prepare('INSERT OR REPLACE INTO settings (id, json) VALUES (1, ?)')
				.run(JSON.stringify(settings));
			return settings;
		} catch (error) {
			const stored = storedSettings();
			if (!stored || isKeyError(error)) throw error;
			return stored;
		}
	});
}

export async function getToday() {
	const settings = await getSettings();
	return { settings, today: todayIn(settings.timeZone) };
}
