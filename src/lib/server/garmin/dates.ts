export type IsoDate = string;

export function todayIn(timeZone: string): IsoDate {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(new Date());
}

export function addDays(date: IsoDate, days: number): IsoDate {
	const d = new Date(`${date}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}

export function weekStart(date: IsoDate, firstDayOfWeek: number): IsoDate {
	const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
	return addDays(date, -((weekday - firstDayOfWeek + 7) % 7));
}

export function weeksBetween(start: IsoDate, end: IsoDate, firstDayOfWeek: number): IsoDate[] {
	const weeks: IsoDate[] = [];
	for (let w = weekStart(start, firstDayOfWeek); w <= end; w = addDays(w, 7)) weeks.push(w);
	return weeks;
}
