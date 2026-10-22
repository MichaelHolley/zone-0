import type { components } from './schema';
import type { Sport } from '#lib/sport.js';
import { garmin, unwrap } from './client';
import type { IsoDate } from './dates';

export type Activity = components['schemas']['SummarizedActivityDTO'];
export type DailySummary = components['schemas']['UserDailySummaryV2DTO'];

const PAGE_SIZE = 99;
const RUNNING_TYPE_ID = 1;
const CYCLING_TYPE_ID = 2;

export async function fetchActivities(startDate: IsoDate, endDate: IsoDate): Promise<Activity[]> {
	const activities: Activity[] = [];
	for (let start = 0; ; start += PAGE_SIZE) {
		const page = unwrap(
			await garmin.GET('/activitylist-service/activities/search/activities', {
				params: { query: { startDate, endDate, start, limit: PAGE_SIZE, excludeChildren: true } }
			})
		);
		activities.push(...page);
		if (page.length < PAGE_SIZE) return activities;
	}
}

export async function fetchDailySummaries(
	startDate: IsoDate,
	endDate: IsoDate
): Promise<DailySummary[]> {
	const result = unwrap(
		await garmin.GET('/usersummary-service/v2/dailysummaries', {
			params: { query: { startDate, endDate } }
		})
	);
	return (result.data ?? []).toSorted((a, b) =>
		(a.calendarDate ?? '').localeCompare(b.calendarDate ?? '')
	);
}

export function sportOf(activity: Activity): Sport {
	const { typeId, parentTypeId, typeKey = '' } = activity.activityType ?? {};
	if (
		typeId === RUNNING_TYPE_ID ||
		parentTypeId === RUNNING_TYPE_ID ||
		typeKey.includes('running')
	) {
		return 'running';
	}
	if (
		typeId === CYCLING_TYPE_ID ||
		parentTypeId === CYCLING_TYPE_ID ||
		/cycling|biking|ride/.test(typeKey)
	) {
		return 'cycling';
	}
	if (typeKey.includes('strength')) return 'strength';
	return 'other';
}

export function activityDate(activity: Activity): IsoDate {
	return (activity.startTimeLocal ?? '').slice(0, 10);
}

export function weightedIntensityMinutes(summary: DailySummary): number {
	const { moderate = 0, vigorous = 0 } = summary.intensityMinutes ?? {};
	return moderate + 2 * vigorous;
}
