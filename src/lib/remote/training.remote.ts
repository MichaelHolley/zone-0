import { query } from '$app/server';
import { utcDate } from '#lib/format.js';
import { cached, HOUR } from '#lib/server/garmin/cache.js';
import {
	activityDate,
	fetchActivities,
	fetchDailySummaries,
	sportOf,
	weightedIntensityMinutes,
	type Activity
} from '#lib/server/garmin/data.js';
import { addDays, weekStart, weeksBetween, type IsoDate } from '#lib/server/garmin/dates.js';
import { getToday } from '#lib/server/garmin/settings.js';
import { SPORTS } from '#lib/sport.js';

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
	const activities = await cached(`activities:${start}:${today}`, HOUR, () =>
		fetchActivities(start, today)
	);
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

const sum = (values: number[]) => values.reduce((total, v) => total + v, 0);
const average = (values: number[]) => (values.length ? sum(values) / values.length : null);

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
	const summaries = await cached(`summaries:${start}:${today}`, HOUR, () =>
		fetchDailySummaries(start, today)
	);

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
