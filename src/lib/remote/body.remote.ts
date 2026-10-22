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

	// The spec types startDate as ConnectDate, but the API returns a plain YYYY-MM-DD string.
	const goalStart = (goal: { startDate?: unknown }) => String(goal.startDate ?? '');
	const goal = (goals.userGoals ?? [])
		.filter((g) => g.goalValue)
		.toSorted((a, b) => goalStart(a).localeCompare(goalStart(b)))
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

const FITNESS_AGE_COMPONENTS = [
	{ key: 'vigorousDaysAvg', label: 'Vigorous days per week', unit: 'days' },
	{ key: 'vigorousMinutesAvg', label: 'Vigorous minutes per week', unit: 'min' },
	{ key: 'rhr', label: 'Resting heart rate', unit: 'bpm' },
	{ key: 'bmi', label: 'BMI', unit: '' }
] as const;

export const getFitnessAge = query(async () => {
	const { today } = await getToday();
	const response = await cached(`fitnessAge:${today}`, HOUR, () =>
		garmin
			.GET('/fitnessage-service/fitnessage/v2/{calendarDate}', {
				params: { path: { calendarDate: today } }
			})
			.then(unwrap)
	);

	// The spec types the response as an array, but the API returns a single object.
	const dto: (typeof response)[number] | undefined = Array.isArray(response)
		? response[0]
		: (response as unknown as (typeof response)[number]);
	if (dto?.fitnessAge == null) return null;

	const components = FITNESS_AGE_COMPONENTS.flatMap(({ key, label, unit }) => {
		const component = dto.components?.[key];
		if (component?.value == null) return [];
		return [
			{
				label,
				unit,
				value: component.value,
				target: component.targetValue ?? null,
				potentialAge: component.potentialAge ?? null,
				priority: component.priority ?? Number.MAX_SAFE_INTEGER
			}
		];
	}).toSorted((a, b) => a.priority - b.priority);

	return {
		fitnessAge: dto.fitnessAge,
		chronologicalAge: dto.chronologicalAge ?? null,
		achievableAge: dto.achievableFitnessAge ?? null,
		components
	};
});
