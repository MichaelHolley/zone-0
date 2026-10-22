import { scaleOrdinal } from '@tanstack/charts/scales/ordinal';
import { SPORT_COLOR, SPORT_LABEL, SPORTS, type Sport } from './sport';
import { formatShortDate } from './format';

export const ACCENT = '#0d9488';
export const ACCENT_SOFT = '#99d5ce';

export const chartTheme = {
	foreground: '#52525b',
	muted: '#71717a',
	grid: '#e4e4e7',
	background: 'transparent'
};

export const sportColor = scaleOrdinal<Sport, string>(
	SPORTS,
	SPORTS.map((sport) => SPORT_COLOR[sport])
);

export const sportLabel = (sport: Sport) => SPORT_LABEL[sport];

export const dateTick = (value: Date) => formatShortDate(value);
