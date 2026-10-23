export const SPORTS = ['running', 'cycling', 'strength', 'other'] as const;
export type Sport = (typeof SPORTS)[number];

export const SPORT_LABEL: Record<Sport, string> = {
	running: 'Running',
	cycling: 'Cycling',
	strength: 'Strength',
	other: 'Other'
};

export const SPORT_COLOR: Record<Sport, string> = {
	running: '#e07a00',
	cycling: '#2563eb',
	strength: '#6d3fd6',
	other: '#b0b0b0'
};
