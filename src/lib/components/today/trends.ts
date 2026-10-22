import { areaY, barY, defineChart, lineY, ruleY } from '@tanstack/charts';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { tooltip } from '@tanstack/charts/tooltip';
import { scaleUtc } from 'd3-scale';
import { ACCENT, chartTheme, dateTick } from '#lib/charts.js';
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

const describe = (row: TrendRow, value: number | null | undefined, unit: string) =>
	`${formatShortDate(row.date)}\n${value == null ? 'No data' : `${formatNumber(value)} ${unit}`}`;

function bounds(rows: TrendRow[]) {
	return [rows[0]?.date ?? new Date(), rows.at(-1)?.date ?? new Date()] as const;
}

export function lineTrend(
	rows: TrendRow[],
	key: NumericKey,
	unit: string,
	reference?: number | null
) {
	return defineChart({
		marks: [
			...(reference == null
				? []
				: [ruleY([reference], { stroke: chartTheme.muted, strokeDasharray: '3 3' })]),
			lineY(rows, { x: 'date', y: key, stroke: ACCENT, strokeWidth: 1.75 })
		],
		scales: axes(...bounds(rows)),
		theme: chartTheme,
		tooltip: { use: tooltip, format: (p) => describe(p.datum, p.datum[key], unit) }
	});
}

export function barTrend(rows: TrendRow[], key: NumericKey, unit: string) {
	return defineChart({
		marks: [barY(rows, { x: 'date', y: key, fill: ACCENT, fillOpacity: 0.85, radius: { end: 2 } })],
		scales: axes(...bounds(rows)),
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
