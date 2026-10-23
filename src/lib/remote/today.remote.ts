import { query } from '$app/server';
import { utcDate } from '#lib/format.js';
import { cached, MINUTE } from '#lib/server/garmin/cache.js';
import { garmin, unwrap } from '#lib/server/garmin/client.js';
import {
	activityDate,
	fetchActivities,
	fetchDailySummaries,
	sportOf,
	weightedIntensityMinutes
} from '#lib/server/garmin/data.js';
import { addDays, weekStart, type IsoDate } from '#lib/server/garmin/dates.js';
import { getToday } from '#lib/server/garmin/settings.js';
import { sum } from '#lib/stats.js';

const TODAY_TTL = 5 * MINUTE;
const TREND_DAYS = 28;

/** Garmin reports unmeasured levels as negative sentinels (-1, -2). */
function measured(value: number | undefined): number | null {
	return value === undefined || value < 0 ? null : value;
}

function fetchDaily(calendarDate: IsoDate) {
	return cached(`daily:${calendarDate}`, TODAY_TTL, async () =>
		unwrap(
			await garmin.GET('/usersummary-service/usersummary/daily', {
				params: { query: { calendarDate } }
			})
		)
	);
}

/** Until the watch syncs, today's summary is an empty shell, so show yesterday instead. */
async function latestDaily(today: IsoDate) {
	const daily = await fetchDaily(today);
	return daily.includesWellnessData ? daily : fetchDaily(addDays(today, -1));
}

export const getVitals = query(async () => {
	const { settings, today } = await getToday();
	const trendStart = addDays(today, -(TREND_DAYS - 1));

	const [daily, summaries] = await Promise.all([
		latestDaily(today),
		cached(`summaries:${trendStart}:${today}`, TODAY_TTL, () =>
			fetchDailySummaries(trendStart, today)
		)
	]);

	const week = weekStart(today, settings.firstDayOfWeek);
	const weekIntensity = sum(
		summaries.filter((s) => (s.calendarDate ?? '') >= week).map(weightedIntensityMinutes)
	);

	return {
		date: daily.calendarDate ?? today,
		restingHr: {
			value: measured(daily.restingHeartRate),
			sevenDayAvg: measured(daily.lastSevenDaysAvgRestingHeartRate)
		},
		stress: {
			avg: measured(daily.averageStressLevel),
			max: measured(daily.maxStressLevel)
		},
		bodyBattery: {
			latest: measured(daily.bodyBatteryMostRecentValue),
			high: measured(daily.bodyBatteryHighestValue),
			low: measured(daily.bodyBatteryLowestValue),
			charged: measured(daily.bodyBatteryChargedValue),
			drained: measured(daily.bodyBatteryDrainedValue)
		},
		intensity: { week: weekIntensity, goal: measured(daily.intensityMinutesGoal) },
		calories: {
			active: measured(daily.activeKilocalories),
			total: measured(daily.totalKilocalories)
		},
		trend: summaries
			.filter((s) => s.calendarDate)
			.map((s) => ({
				date: utcDate(s.calendarDate!),
				restingHr: measured(s.heartRate?.restingValue),
				stressAvg: measured(s.stress?.avgLevel),
				bodyBatteryLow: measured(s.bodyBattery?.minValue),
				bodyBatteryHigh: measured(s.bodyBattery?.maxValue),
				intensity: weightedIntensityMinutes(s),
				caloriesActive: measured(s.calories?.burnedActive)
			}))
	};
});

export const getWeekWorkouts = query(async () => {
	const { settings, today } = await getToday();
	const start = weekStart(today, settings.firstDayOfWeek);
	const activities = await cached(`activities:${start}:${today}`, TODAY_TTL, () =>
		fetchActivities(start, today)
	);

	return activities
		.toSorted((a, b) => (b.startTimeLocal ?? '').localeCompare(a.startTimeLocal ?? ''))
		.map((a) => ({
			id: a.activityId ?? 0,
			date: activityDate(a),
			sport: sportOf(a),
			name: a.activityName ?? a.activityType?.typeKey ?? 'Activity',
			duration: a.duration ?? 0,
			distance: a.distance && a.distance > 0 ? a.distance : null,
			averageHr: a.averageHR ?? null,
			trainingEffect: a.trainingEffectLabel === 'UNKNOWN' ? null : (a.trainingEffectLabel ?? null)
		}));
});
