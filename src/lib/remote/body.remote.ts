import { query } from '$app/server';
import { utcDate } from '#lib/format.js';
import { cached, HOUR } from '#lib/server/garmin/cache.js';
import { garmin, unwrap } from '#lib/server/garmin/client.js';
import { addDays } from '#lib/server/garmin/dates.js';
import { getToday } from '#lib/server/garmin/settings.js';

export const getBody = query(async () => {
	const { today } = await getToday();
	const start = addDays(today, -364);
	const path = { startDate: start, endDate: today };

	const [range, goals] = await cached(`body:${start}:${today}`, HOUR, async () =>
		Promise.all([
			garmin
				.GET('/weight-service/weight/range/{startDate}/{endDate}', { params: { path } })
				.then(unwrap),
			garmin
				.GET('/goal-service/goal/user/effective/weightgoal/{startDate}/{endDate}', {
					params: { path }
				})
				.then(unwrap)
		])
	);

	const points = (range.dailyWeightSummaries ?? [])
		.flatMap((day) => {
			const grams = day.latestWeight?.weight;
			if (!day.summaryDate || !grams) return [];
			return [{ date: day.summaryDate, grams, bmi: day.latestWeight?.bmi ?? null }];
		})
		.toSorted((a, b) => a.date.localeCompare(b.date));

	const goal = (goals.userGoals ?? [])
		.filter((g) => g.goalValue)
		.toSorted((a, b) => (a.startDate?.localDate ?? '').localeCompare(b.startDate?.localDate ?? ''))
		.at(-1);

	const latest = points.at(-1) ?? null;
	const monthAgo = points.findLast((p) => p.date <= addDays(today, -30));
	const first = points.at(0);

	return {
		series: points.map((p) => ({ date: utcDate(p.date), grams: p.grams })),
		goalGrams: goal?.goalValue ?? null,
		current: latest && { grams: latest.grams, date: latest.date, bmi: latest.bmi },
		change30: latest && monthAgo ? latest.grams - monthAgo.grams : null,
		change365: latest && first && first !== latest ? latest.grams - first.grams : null
	};
});
