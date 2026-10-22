export const SPORTS = ['running', 'cycling', 'strength', 'other'] as const;
export type Sport = (typeof SPORTS)[number];

export const SPORT_LABEL: Record<Sport, string> = {
	running: 'Running',
	cycling: 'Cycling',
	strength: 'Strength',
	other: 'Other'
};

export const SPORT_COLOR: Record<Sport, string> = {
	running: '#ea580c',
	cycling: '#2563eb',
	strength: '#be185d',
	other: '#a1a1aa'
};
