import { areaY, barY, defineChart, lineY, ruleY } from '@tanstack/charts';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { tooltip } from '@tanstack/charts/tooltip';
import { scaleUtc } from 'd3-scale';
import { ACCENT, chartTheme, DAY_MS, dateTick, paddedTimeScale } from '#lib/charts.js';
import { formatNumber, formatShortDate } from '#lib/format.js';
import type { getVitals } from '#lib/remote/today.remote.js';

type TrendRow = Awaited<ReturnType<typeof getVitals>>['trend'][number];
type NumericKey = {
	[K in keyof TrendRow]: TrendRow[K] extends number | null ? K : never;
}[keyof TrendRow];

const axes = (first: Date, last: Date) => ({
	x: {
		scale: scaleUtc,
		axis: { line: false, ticks: { values: [first, last], size: 0, format: dateTick } }
	},
	y: {
		scale: scaleLinear,
		nice: 3,
		grid: true,
		axis: { line: false, ticks: { count: 3, size: 0 } }
	}
});

function barAxes(rows: TrendRow[]) {
	const scales = axes(...bounds(rows));
	if (rows.length === 0) return scales;
	const scale = paddedTimeScale(
		rows.map((row) => row.date),
		DAY_MS
	);
	return { ...scales, x: { ...scales.x, scale } };
}

const describe = (row: TrendRow, value: number | null | undefined, unit: string) =>
	`${formatShortDate(row.date)}\n${value == null ? 'No data' : `${formatNumber(value)} ${unit}`}`;

function bounds(rows: TrendRow[]) {
	return [rows[0]?.date ?? new Date(), rows.at(-1)?.date ?? new Date()] as const;
}

export function lineTrend(rows: TrendRow[], key: NumericKey, unit: string) {
	return defineChart({
		marks: [lineY(rows, { x: 'date', y: key, stroke: ACCENT, strokeWidth: 1.75 })],
		scales: axes(...bounds(rows)),
		theme: chartTheme,
		tooltip: { use: tooltip, format: (p) => describe(p.datum, p.datum[key], unit) }
	});
}

export function barTrend(rows: TrendRow[], key: NumericKey, unit: string) {
	return defineChart({
		marks: [barY(rows, { x: 'date', y: key, fill: ACCENT, fillOpacity: 0.85, radius: { end: 2 } })],
		scales: barAxes(rows),
		theme: chartTheme,
		tooltip: { use: tooltip, format: (p) => describe(p.datum, p.datum[key], unit) }
	});
}

export function areaTrend(rows: TrendRow[], key: NumericKey, unit: string) {
	return defineChart({
		marks: [
			areaY(rows, { x: 'date', y: key, fill: ACCENT, fillOpacity: 0.12 }),
			lineY(rows, { x: 'date', y: key, stroke: ACCENT, strokeWidth: 1.75 })
		],
		scales: axes(...bounds(rows)),
		theme: chartTheme,
		tooltip: { use: tooltip, format: (p) => describe(p.datum, p.datum[key], unit) }
	});
}

export function rangeTrend(rows: TrendRow[]) {
	return defineChart({
		marks: [
			areaY(rows, {
				x: 'date',
				y1: 'bodyBatteryLow',
				y2: 'bodyBatteryHigh',
				fill: ACCENT,
				fillOpacity: 0.25
			}),
			lineY(rows, { x: 'date', y: 'bodyBatteryHigh', stroke: ACCENT, strokeWidth: 1.5 })
		],
		scales: axes(...bounds(rows)),
		theme: chartTheme,
		tooltip: {
			use: tooltip,
			format: (p) =>
				p.datum.bodyBatteryHigh == null
					? `${formatShortDate(p.datum.date)}\nNo data`
					: `${formatShortDate(p.datum.date)}\nHigh ${p.datum.bodyBatteryHigh}, low ${p.datum.bodyBatteryLow}`
		}
	});
}

export function heartRateTrend(rows: TrendRow[], sevenDayAvg: number | null) {
	return defineChart({
		marks: [
			barY(rows, {
				x: 'date',
				y1: 'hrLow',
				y2: 'hrHigh',
				fill: ACCENT,
				fillOpacity: 0.2,
				radius: 2
			}),
			...(sevenDayAvg == null
				? []
				: [ruleY([sevenDayAvg], { stroke: chartTheme.muted, strokeDasharray: '3 3' })]),
			lineY(rows, { x: 'date', y: 'restingHr', stroke: ACCENT, strokeWidth: 1.75 })
		],
		scales: barAxes(rows),
		theme: chartTheme,
		tooltip: {
			use: tooltip,
			format: ({ datum }) =>
				datum.restingHr == null
					? `${formatShortDate(datum.date)}\nNo data`
					: `${formatShortDate(datum.date)}\nResting ${datum.restingHr} bpm\nLow ${datum.hrLow ?? '–'}, high ${datum.hrHigh ?? '–'}`
		}
	});
}
