import { query } from '$app/server';
import { utcDate } from '#lib/format.js';
import {
	activityDate,
	sportOf,
	weightedIntensityMinutes,
	type Activity
} from '#lib/server/garmin/data.js';
import { addDays, weekStart, weeksBetween, type IsoDate } from '#lib/server/garmin/dates.js';
import { getToday } from '#lib/server/garmin/settings.js';
import { getActivities, getDailySummaries } from '#lib/server/garmin/store.js';
import { SPORTS } from '#lib/sport.js';
import { average, median, sum } from '#lib/stats.js';

const rideKind = (typeKey = '') =>
	typeKey.includes('indoor') ? 'Indoor' : typeKey.includes('gravel') ? 'Gravel' : 'Road';
const runKind = (typeKey = '') => (typeKey.includes('treadmill') ? 'Treadmill' : 'Outdoor');
const movingSeconds = (activity: Activity) => activity.movingDuration ?? activity.duration ?? 0;

const HR_ZONES = [1, 2, 3, 4, 5] as const;
const RUNNING_BESTS = [
	{ meters: 1000, label: '1 km' },
	{ meters: 1609, label: '1 mile' },
	{ meters: 5000, label: '5 km' },
	{ meters: 10000, label: '10 km' },
	{ meters: 21098, label: 'Half marathon' },
	{ meters: 42195, label: 'Marathon' }
] as const;

async function lastYear() {
	const { settings, today } = await getToday();
	const start = addDays(today, -364);
	const activities = await getActivities(start, today);
	const weeks = weeksBetween(start, today, settings.firstDayOfWeek);
	const weekOf = (date: IsoDate) => weekStart(date, settings.firstDayOfWeek);
	return { settings, today, start, activities, weeks, weekOf };
}

function groupByWeek(activities: Activity[], weekOf: (date: IsoDate) => IsoDate) {
	const byWeek = new Map<IsoDate, Activity[]>();
	for (const activity of activities) {
		const week = weekOf(activityDate(activity));
		byWeek.set(week, [...(byWeek.get(week) ?? []), activity]);
	}
	return byWeek;
}

const zoneSeconds = (activities: Activity[]) =>
	HR_ZONES.map((zone) => ({
		zone,
		seconds: sum(activities.map((a) => a[`hrTimeInZone_${zone}`] ?? 0))
	}));

export const getWeeklyVolume = query(async () => {
	const { activities, weeks, weekOf } = await lastYear();
	const byWeek = groupByWeek(activities, weekOf);

	return weeks.flatMap((week) =>
		SPORTS.map((sport) => {
			const inSport = (byWeek.get(week) ?? []).filter((a) => sportOf(a) === sport);
			return {
				week: utcDate(week),
				sport,
				duration: sum(inSport.map((a) => a.duration ?? 0)),
				distance: sum(inSport.map((a) => a.distance ?? 0)),
				count: inSport.length
			};
		})
	);
});

export const getIntensityAndLoad = query(async () => {
	const { activities, weeks, weekOf, start, today } = await lastYear();
	const byWeek = groupByWeek(activities, weekOf);
	const summaries = await getDailySummaries(start, today);

	const intensityByWeek = new Map<IsoDate, { minutes: number; goal: number | null }>();
	for (const summary of summaries) {
		if (!summary.calendarDate) continue;
		const week = weekOf(summary.calendarDate);
		const entry = intensityByWeek.get(week) ?? { minutes: 0, goal: null };
		entry.minutes += weightedIntensityMinutes(summary);
		entry.goal = summary.intensityMinutes?.goal ?? entry.goal;
		intensityByWeek.set(week, entry);
	}

	const rows = weeks.map((week) => {
		const inWeek = byWeek.get(week) ?? [];
		const aerobic = inWeek.flatMap((a) =>
			a.aerobicTrainingEffect ? [a.aerobicTrainingEffect] : []
		);
		const anaerobic = inWeek.flatMap((a) =>
			a.anaerobicTrainingEffect ? [a.anaerobicTrainingEffect] : []
		);
		return {
			week: utcDate(week),
			zones: HR_ZONES.map((zone) => ({
				zone,
				seconds: sum(inWeek.map((a) => a[`hrTimeInZone_${zone}`] ?? 0))
			})),
			load: sum(inWeek.map((a) => a.activityTrainingLoad ?? 0)),
			intensity: intensityByWeek.get(week) ?? { minutes: 0, goal: null },
			aerobicEffect: average(aerobic),
			anaerobicEffect: average(anaerobic)
		};
	});

	return {
		zones: rows.flatMap(({ week, zones }) => zones.map((z) => ({ week, ...z }))),
		load: rows.map(({ week, load }) => ({ week, load })),
		intensity: rows.map(({ week, intensity }) => ({ week, ...intensity })),
		trainingEffect: rows.flatMap(({ week, aerobicEffect, anaerobicEffect }) => [
			{ week, kind: 'Aerobic', value: aerobicEffect },
			{ week, kind: 'Anaerobic', value: anaerobicEffect }
		])
	};
});

export const getRunningBests = query(async () => {
	const { activities } = await lastYear();
	const runs = activities.filter((a) => sportOf(a) === 'running');

	return RUNNING_BESTS.flatMap(({ meters, label }) => {
		let best: { seconds: number; date: IsoDate } | null = null;
		for (const run of runs) {
			const seconds = run[`fastestSplit_${meters}`];
			if (seconds && seconds > 0 && (!best || seconds < best.seconds)) {
				best = { seconds, date: activityDate(run) };
			}
		}
		return best ? [{ meters, label, ...best }] : [];
	});
});

export const getStrength = query(async () => {
	const { activities, weeks, weekOf } = await lastYear();
	const sessions = activities.filter((a) => sportOf(a) === 'strength');
	const byWeek = groupByWeek(sessions, weekOf);

	let activeWeeks = 0;
	let longestStreak = 0;
	let streak = 0;
	for (const week of weeks) {
		if (byWeek.has(week)) {
			activeWeeks++;
			streak++;
			longestStreak = Math.max(longestStreak, streak);
		} else {
			streak = 0;
		}
	}

	return {
		consistency: { activeWeeks, totalWeeks: weeks.length, longestStreak },
		sessions: sessions
			.map((a) => ({
				date: activityDate(a),
				duration: a.duration ?? 0,
				heartRate: a.averageHR ?? null,
				maxHeartRate: a.maxHR ?? null,
				calories: a.calories ?? null,
				aerobicEffect: a.aerobicTrainingEffect ?? null,
				anaerobicEffect: a.anaerobicTrainingEffect ?? null
			}))
			.toSorted((a, b) => a.date.localeCompare(b.date))
	};
});

export const getRunning = query(async () => {
	const { activities } = await lastYear();
	const runs = activities.filter((a) => sportOf(a) === 'running');
	return {
		zones: zoneSeconds(runs),
		runs: runs
			.map((a) => ({
				date: activityDate(a),
				kind: runKind(a.activityType?.typeKey),
				distance: a.distance ?? 0,
				movingSeconds: movingSeconds(a),
				maxSpeed: a.maxSpeed ?? null,
				heartRate: a.averageHR ?? null,
				cadence: a.averageRunningCadenceInStepsPerMinute ?? null
			}))
			.toSorted((a, b) => a.date.localeCompare(b.date))
	};
});

export const getCycling = query(async () => {
	const { activities, weeks, weekOf } = await lastYear();
	const rides = activities.filter((a) => sportOf(a) === 'cycling');
	const byWeek = groupByWeek(rides, weekOf);

	return {
		zones: zoneSeconds(rides),
		weeks: weeks.map((week) => ({
			week: utcDate(week),
			elevation: sum((byWeek.get(week) ?? []).map((a) => a.elevationGain ?? 0))
		})),
		rides: rides
			.map((a) => ({
				date: activityDate(a),
				kind: rideKind(a.activityType?.typeKey),
				distance: a.distance ?? 0,
				movingSeconds: movingSeconds(a),
				elevation: a.elevationGain ?? 0,
				speed: a.averageSpeed ?? null,
				heartRate: a.averageHR ?? null
			}))
			.toSorted((a, b) => a.date.localeCompare(b.date))
	};
});

/** Each 100 m climbed counts as 1 km of flat riding. */
const CLIMB_FLAT_FACTOR = 10;
/** Average heart rate of shorter efforts is still catching up with the effort. */
const MIN_EFFORT_SECONDS = 5 * 60;
/** Efforts barely above resting heart rate would blow up the normalization. */
const MIN_HR_ABOVE_REST = 15;
/** Power grows with the cube of speed on a bike (air drag) but linearly when running. */
const CYCLING_EXPONENT = 1 / 3;
const RUNNING_EXPONENT = 1;

type Effort = { heartRate: number; adjustedSpeed: number };

/** Scales each effort's speed to what it would be at the sport's typical heart rate. */
function normalizeEfforts<T extends Effort>(
	efforts: T[],
	restingHr: number | null,
	exponent: number
) {
	const typicalHr = median(efforts.map((effort) => effort.heartRate));
	if (restingHr == null || typicalHr == null) return { referenceHr: null, efforts: [] };
	const referenceHr = Math.round(typicalHr / 5) * 5;
	return {
		referenceHr,
		efforts: efforts
			.filter((effort) => effort.heartRate - restingHr >= MIN_HR_ABOVE_REST)
			.map((effort) => ({
				...effort,
				normalizedSpeed:
					effort.adjustedSpeed *
					((referenceHr - restingHr) / (effort.heartRate - restingHr)) ** exponent
			}))
	};
}

function timedEffort(activity: Activity) {
	const seconds = movingSeconds(activity);
	const { distance, averageHR, elevationGain = 0 } = activity;
	if (!distance || !averageHR || seconds < MIN_EFFORT_SECONDS) return null;
	return {
		date: activityDate(activity),
		heartRate: averageHR,
		distance,
		elevation: elevationGain,
		speed: distance / seconds
	};
}

export const getProgress = query(async () => {
	const { activities, start, today } = await lastYear();
	const summaries = await getDailySummaries(start, today);
	const restingHr = median(summaries.flatMap((s) => s.heartRate?.restingValue ?? []));

	const rides = activities.flatMap((a) => {
		const kind = rideKind(a.activityType?.typeKey);
		const effort = sportOf(a) === 'cycling' && kind !== 'Indoor' ? timedEffort(a) : null;
		if (!effort) return [];
		const flatDistance = effort.distance + CLIMB_FLAT_FACTOR * effort.elevation;
		return [{ ...effort, kind, adjustedSpeed: (flatDistance / effort.distance) * effort.speed }];
	});
	const runs = activities.flatMap((a) => {
		const effort = sportOf(a) === 'running' ? timedEffort(a) : null;
		if (!effort) return [];
		const kind = runKind(a.activityType?.typeKey);
		return [{ ...effort, kind, adjustedSpeed: a.avgGradeAdjustedSpeed ?? effort.speed }];
	});

	return {
		cycling: normalizeEfforts(rides, restingHr, CYCLING_EXPONENT),
		running: normalizeEfforts(runs, restingHr, RUNNING_EXPONENT),
		restingHr
	};
});
