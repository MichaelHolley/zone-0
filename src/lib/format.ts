export type MeasurementSystem = 'metric' | 'statute_us' | 'statute_uk';

const METERS_PER_MILE = 1609.344;
const GRAMS_PER_POUND = 453.59237;
const LOCALE = 'en-GB';

const isMetric = (system: MeasurementSystem) => system === 'metric';

export const distanceUnit = (system: MeasurementSystem) => (isMetric(system) ? 'km' : 'mi');
export const weightUnit = (system: MeasurementSystem) => (isMetric(system) ? 'kg' : 'lb');

export function toDistance(meters: number, system: MeasurementSystem): number {
	return meters / (isMetric(system) ? 1000 : METERS_PER_MILE);
}

export function toWeight(grams: number, system: MeasurementSystem): number {
	return grams / (isMetric(system) ? 1000 : GRAMS_PER_POUND);
}

export function formatNumber(value: number, digits = 0): string {
	return value.toLocaleString(LOCALE, {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	});
}

export function formatDistance(meters: number, system: MeasurementSystem): string {
	const value = toDistance(meters, system);
	return `${formatNumber(value, value < 100 ? 1 : 0)} ${distanceUnit(system)}`;
}

export function formatWeight(grams: number, system: MeasurementSystem, signed = false): string {
	const value = toWeight(grams, system);
	const sign = signed && value > 0 ? '+' : '';
	return `${sign}${formatNumber(value, 1)} ${weightUnit(system)}`;
}

export function formatDuration(seconds: number): string {
	const total = Math.round(seconds / 60);
	const hours = Math.floor(total / 60);
	const minutes = total % 60;
	if (hours === 0) return `${minutes}m`;
	return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

export function formatClock(seconds: number): string {
	const rounded = Math.round(seconds);
	const h = Math.floor(rounded / 3600);
	const m = Math.floor((rounded % 3600) / 60);
	const s = rounded % 60;
	const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
	return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}

export function formatPace(seconds: number, meters: number, system: MeasurementSystem): string {
	const perUnit = seconds / toDistance(meters, system);
	return `${formatClock(perUnit)} /${distanceUnit(system)}`;
}

export function formatHours(seconds: number): string {
	return `${formatNumber(seconds / 3600, 1)} h`;
}

const dayFormat = new Intl.DateTimeFormat(LOCALE, {
	weekday: 'short',
	day: 'numeric',
	month: 'short',
	timeZone: 'UTC'
});
const shortDateFormat = new Intl.DateTimeFormat(LOCALE, {
	day: 'numeric',
	month: 'short',
	timeZone: 'UTC'
});
const longDateFormat = new Intl.DateTimeFormat(LOCALE, {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	timeZone: 'UTC'
});

export const utcDate = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`);
export const formatDay = (iso: string) => dayFormat.format(utcDate(iso));
export const formatShortDate = (date: Date) => shortDateFormat.format(date);
export const formatLongDate = (iso: string) => longDateFormat.format(utcDate(iso));
