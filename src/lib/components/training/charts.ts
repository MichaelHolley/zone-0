import { barY, colorLegend, defineChart, dot, lineY, ruleY } from '@tanstack/charts';
import { decorative } from '@tanstack/charts/mark/decorative';
import { scaleBand } from '@tanstack/charts/scales/band';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { tooltip } from '@tanstack/charts/tooltip';
import { scaleLinear as d3ScaleLinear, scaleUtc } from 'd3-scale';
import {
	ACCENT,
	chartTheme,
	DAY_MS,
	paddedTimeScale,
	sportColor,
	sportLabel
} from '#lib/charts.js';
import {
	distanceUnit,
	elevationUnit,
	formatLongDate,
	formatNumber,
	speedUnit,
	toDistance,
	toElevation,
	toSpeed,
	utcDate,
	type MeasurementSystem
} from '#lib/format.js';
import type {
	getCycling,
	getIntensityAndLoad,
	getStrength,
	getWeeklyVolume
} from '#lib/remote/training.remote.js';
import { SPORT_COLOR, SPORTS, type Sport } from '#lib/sport.js';
import { sum } from '#lib/stats.js';

type Resolved<T extends (...args: never[]) => Promise<unknown>> = Awaited<ReturnType<T>>;
type VolumeWeek = Resolved<typeof getWeeklyVolume>[number];
type Intensity = Resolved<typeof getIntensityAndLoad>;
type Cycling = Resolved<typeof getCycling>;
export type Ride = Cycling['rides'][number];
type Strength = Resolved<typeof getStrength>;
export type StrengthSession = Strength['sessions'][number];

const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' });
const monthTick = (value: Date) => monthFormat.format(value);
const longDate = (date: Date) => formatLongDate(date.toISOString());
const weekLabel = (date: Date) => `Week of ${longDate(date)}`;

const weekAxis = {
	scale: scaleUtc,
	axis: { line: false, ticks: { count: 6, size: 0, format: monthTick } }
};

const valueAxis = {
	scale: scaleLinear,
	nice: 4,
	grid: true,
	axis: { line: false, ticks: { count: 4, size: 0 } }
};

function barScales(rows: { week: Date }[]) {
	return {
		x: {
			...weekAxis,
			scale: paddedTimeScale(
				rows.map((row) => row.week),
				7 * DAY_MS
			)
		},
		y: valueAxis
	};
}

export const METRICS = ['duration', 'distance', 'count'] as const;
export type VolumeMetric = (typeof METRICS)[number];
export const METRIC_LABEL: Record<VolumeMetric, string> = {
	duration: 'Duration',
	distance: 'Distance',
	count: 'Count'
};

export type VolumeRow = { week: Date; sport: Sport; value: number };

export function volumeRows(
	data: VolumeWeek[],
	metric: VolumeMetric,
	system: MeasurementSystem
): VolumeRow[] {
	return data.flatMap(({ week, sport, duration, distance, count }) => {
		if (metric === 'distance') {
			const hasDistance = sport === 'running' || sport === 'cycling' || sport === 'walking';
			return hasDistance ? [{ week, sport, value: toDistance(distance, system) }] : [];
		}
		return [{ week, sport, value: metric === 'duration' ? duration / 3600 : count }];
	});
}

export const sportsWithData = (rows: VolumeRow[]): Sport[] =>
	SPORTS.filter((sport) => rows.some((row) => row.sport === sport && row.value > 0));

function formatVolume(value: number, metric: VolumeMetric, system: MeasurementSystem) {
	if (metric === 'duration') return `${formatNumber(value, 1)} h`;
	if (metric === 'distance') return `${formatNumber(value, 1)} ${distanceUnit(system)}`;
	return `${formatNumber(value)} ${value === 1 ? 'workout' : 'workouts'}`;
}

export function volumeChart(rows: VolumeRow[], metric: VolumeMetric, system: MeasurementSystem) {
	return defineChart({
		marks: [
			barY(
				rows.filter((row) => row.value > 0),
				{ x: 'week', y: 'value', z: 'sport', color: 'sport', radius: { end: 2 } }
			)
		],
		scales: barScales(rows),
		color: { scale: sportColor },
		theme: chartTheme,
		tooltip: {
			use: tooltip,
			format: (p) =>
				`${weekLabel(p.datum.week)}\n${sportLabel(p.datum.sport)} ${formatVolume(p.datum.value, metric, system)}`
		}
	});
}

export const ZONES = [
	{ zone: 1, label: 'Zone 1', color: '#dddddd' },
	{ zone: 2, label: 'Zone 2', color: '#60a5fa' },
	{ zone: 3, label: 'Zone 3', color: '#4ade80' },
	{ zone: 4, label: 'Zone 4', color: '#fb923c' },
	{ zone: 5, label: 'Zone 5', color: '#ef4444' }
] as const;

export const EFFECTS = [
	{ label: 'Aerobic', color: ACCENT },
	{ label: 'Anaerobic', color: '#222222' }
] as const;

export const formatHoursMinutes = (seconds: number) => {
	const minutes = Math.round(seconds / 60);
	return minutes >= 60 ? `${formatNumber(minutes / 60, 1)} h` : `${formatNumber(minutes)} min`;
};

export function zonesChart(rows: Intensity['zones']) {
	const hours = rows
		.filter((row) => row.seconds > 0)
		.map((row) => ({ ...row, hours: row.seconds / 3600 }));
	return defineChart({
		marks: [
			barY(hours, {
				x: 'week',
				y: 'hours',
				z: 'zone',
				color: (row) => `Zone ${row.zone}`,
				radius: { end: 2 }
			})
		],
		scales: barScales(rows),
		color: { domain: ZONES.map((z) => z.label), range: ZONES.map((z) => z.color) },
		theme: chartTheme,
		tooltip: {
			use: tooltip,
			format: (p) =>
				`${weekLabel(p.datum.week)}\nZone ${p.datum.zone} ${formatHoursMinutes(p.datum.seconds)}`
		}
	});
}

export function loadChart(rows: Intensity['load']) {
	return defineChart({
		marks: [
			barY(rows, { x: 'week', y: 'load', fill: ACCENT, fillOpacity: 0.85, radius: { end: 2 } })
		],
		scales: barScales(rows),
		theme: chartTheme,
		tooltip: {
			use: tooltip,
			format: (p) => `${weekLabel(p.datum.week)}\nLoad ${formatNumber(p.datum.load)}`
		}
	});
}

export function intensityChart(rows: Intensity['intensity']) {
	const goal = rows.findLast((row) => row.goal)?.goal ?? null;
	return defineChart({
		marks: [
			barY(rows, { x: 'week', y: 'minutes', fill: ACCENT, fillOpacity: 0.85, radius: { end: 2 } }),
			...(goal == null
				? []
				: [
						ruleY([goal], {
							stroke: chartTheme.foreground,
							strokeDasharray: '4 3',
							strokeOpacity: 0.8
						})
					])
		],
		scales: barScales(rows),
		theme: chartTheme,
		tooltip: {
			use: tooltip,
			format: (p) =>
				`${weekLabel(p.datum.week)}\n${formatNumber(p.datum.minutes)} min${goal == null ? '' : ` of ${formatNumber(goal)} goal`}`
		}
	});
}

export function effectChart(rows: Intensity['trainingEffect']) {
	return defineChart({
		marks: [lineY(rows, { x: 'week', y: 'value', z: 'kind', color: 'kind', strokeWidth: 1.75 })],
		scales: {
			x: weekAxis,
			y: {
				scale: scaleLinear().domain([0, 5]),
				grid: true,
				axis: { line: false, ticks: { count: 5, size: 0 } }
			}
		},
		color: { domain: EFFECTS.map((e) => e.label), range: EFFECTS.map((e) => e.color) },
		theme: chartTheme,
		tooltip: {
			use: tooltip,
			format: (p) =>
				`${weekLabel(p.datum.week)}\n${p.datum.kind} ${p.datum.value == null ? 'No data' : formatNumber(p.datum.value, 1)}`
		}
	});
}

export const RIDE_SYMBOLS = [
	{ label: 'Road', color: chartTheme.muted, hollow: true },
	{ label: 'Gravel', color: chartTheme.muted }
] as const;

export function elevationChart(rows: Cycling['weeks'], system: MeasurementSystem) {
	const unit = elevationUnit(system);
	const data = rows.map((row) => ({ ...row, elevation: toElevation(row.elevation, system) }));
	return defineChart({
		marks: [
			barY(data, {
				x: 'week',
				y: 'elevation',
				fill: sportColor('cycling'),
				fillOpacity: 0.85,
				radius: { end: 2 }
			})
		],
		scales: barScales(rows),
		theme: chartTheme,
		tooltip: {
			use: tooltip,
			format: (p) =>
				`${weekLabel(p.datum.week)}\n${formatNumber(p.datum.elevation)} ${unit} climbed`
		}
	});
}

const DOT_RADIUS = 4.5;

export function speedChart(rides: Ride[], system: MeasurementSystem) {
	const unit = speedUnit(system);
	const data = rides.flatMap(({ date, kind, speed, heartRate }) =>
		speed != null && kind !== 'Indoor'
			? [{ date: utcDate(date), kind, heartRate, speed: toSpeed(speed, system) }]
			: []
	);
	const heartRates = data.flatMap((ride) => (ride.heartRate == null ? [] : [ride.heartRate]));
	return defineChart({
		marks: [
			dot(data, { x: 'date', y: 'speed', color: 'heartRate', r: DOT_RADIUS }),
			/** Dot colors only reach the fill, so road rings need a white center overlay. */
			decorative(
				dot(
					data.filter((ride) => ride.kind === 'Road'),
					{ x: 'date', y: 'speed', fill: '#ffffff', r: DOT_RADIUS - 2 }
				)
			)
		],
		scales: { x: weekAxis, y: { ...valueAxis, nice: true } },
		color: {
			scale: d3ScaleLinear<string>()
				.domain([Math.min(...heartRates), Math.max(...heartRates)])
				.range([ZONES[2].color, ZONES[3].color])
				.unknown(chartTheme.muted),
			legend: colorLegend({ label: 'Avg HR (bpm)', format: (value) => formatNumber(value) })
		},
		theme: chartTheme,
		tooltip: {
			use: tooltip,
			format: (p) =>
				`${longDate(p.datum.date)}\n${p.datum.kind} ${formatNumber(p.datum.speed, 1)} ${unit}${p.datum.heartRate == null ? '' : ` at ${formatNumber(p.datum.heartRate)} bpm`}`
		}
	});
}

export function rideClimbChart(rides: Ride[], system: MeasurementSystem) {
	const unit = speedUnit(system);
	const data = rides.flatMap(({ date, kind, distance, elevation, speed }) =>
		speed != null && kind !== 'Indoor' && distance > 0
			? [
					{
						date,
						kind,
						distance: toDistance(distance, system),
						climb: toElevation(elevation, system),
						speed: toSpeed(speed, system)
					}
				]
			: []
	);
	const speeds = data.map((ride) => ride.speed);
	const slowest = Math.min(...speeds);
	const fastest = Math.max(...speeds);
	return defineChart({
		marks: [
			dot(data, {
				x: 'distance',
				y: 'climb',
				key: (ride) => `${ride.date}-${ride.distance}`,
				color: 'speed',
				r: DOT_RADIUS
			}),
			decorative(
				dot(
					data.filter((ride) => ride.kind === 'Road'),
					{ x: 'distance', y: 'climb', fill: '#ffffff', r: DOT_RADIUS - 2 }
				)
			)
		],
		scales: {
			x: {
				scale: scaleLinear,
				nice: true,
				axis: { line: false, ticks: { count: 5, size: 0 } }
			},
			y: { ...valueAxis, nice: true }
		},
		color: {
			scale: d3ScaleLinear<string>()
				.domain([slowest, fastest])
				.range(['#4ade80', SPORT_COLOR.cycling]),
			legend: colorLegend({
				label: `Avg speed (${unit})`,
				format: (value) => formatNumber(value)
			})
		},
		theme: chartTheme,
		tooltip: {
			use: tooltip,
			format: (p) =>
				`${formatLongDate(p.datum.date)}\n${p.datum.kind} ${formatNumber(p.datum.distance, 1)} ${distanceUnit(system)}, ${formatNumber(p.datum.climb)} ${elevationUnit(system)} climbed\n${formatNumber(p.datum.speed, 1)} ${unit}`
		}
	});
}

const TREND_WINDOW = 10;

export function sessionTrendChart<T extends { date: string }>(
	sessions: T[],
	pick: (session: T) => number | null,
	format: (value: number) => string,
	color = SPORT_COLOR.strength
) {
	const points = sessions.flatMap((session) => {
		const value = pick(session);
		return value == null ? [] : [{ date: utcDate(session.date), value }];
	});
	const rows = points.map((point, index) => {
		const recent = points.slice(Math.max(0, index - TREND_WINDOW + 1), index + 1);
		return { ...point, average: recent.reduce((s, p) => s + p.value, 0) / recent.length };
	});
	return defineChart({
		marks: [
			dot(rows, { x: 'date', y: 'value', fill: color, fillOpacity: 0.3, r: 3 }),
			lineY(rows, { x: 'date', y: 'average', stroke: color, strokeWidth: 2 })
		],
		scales: {
			x: weekAxis,
			y: {
				...valueAxis,
				nice: true,
				axis: { ...valueAxis.axis, ticks: { ...valueAxis.axis.ticks, format } }
			}
		},
		theme: chartTheme,
		tooltip: {
			use: tooltip,
			format: (p) =>
				`${longDate(p.datum.date)}\n${format(p.datum.value)}\n${format(p.datum.average)} average of last ${TREND_WINDOW}`
		}
	});
}

type CategoryBar = { label: string; value: number; color: string; detail: string };

function categoryChart(bars: CategoryBar[]) {
	return defineChart({
		marks: [barY(bars, { x: 'label', y: 'value', color: 'label', radius: { end: 2 } })],
		scales: {
			x: {
				scale: () =>
					scaleBand<string>()
						.domain(bars.map((bar) => bar.label))
						.padding(0.16),
				axis: { line: false, ticks: { size: 0 } }
			},
			y: valueAxis
		},
		color: { domain: bars.map((bar) => bar.label), range: bars.map((bar) => bar.color) },
		theme: chartTheme,
		tooltip: { use: tooltip, format: (p) => `${p.datum.label}\n${p.datum.detail}` }
	});
}

export function weekdayChart(rows: Strength['weekdays']) {
	return categoryChart(
		rows.map(({ label, count }) => ({
			label,
			value: count,
			color: SPORT_COLOR.strength,
			detail: `${formatNumber(count)} ${count === 1 ? 'session' : 'sessions'}`
		}))
	);
}

export function zoneShareChart(rows: Cycling['zones']) {
	const total = sum(rows.map((row) => row.seconds));
	return categoryChart(
		rows.map(({ zone, seconds }) => {
			const share = total > 0 ? (seconds / total) * 100 : 0;
			return {
				label: ZONES[zone - 1].label,
				value: share,
				color: ZONES[zone - 1].color,
				detail: `${formatNumber(share)}% (${formatHoursMinutes(seconds)})`
			};
		})
	);
}
