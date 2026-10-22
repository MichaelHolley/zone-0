export const SPORTS = ['running', 'cycling', 'strength', 'other'] as const;
export type Sport = (typeof SPORTS)[number];

export const SPORT_LABEL: Record<Sport, string> = {
	running: 'Running',
	cycling: 'Cycling',
	strength: 'Strength',
	other: 'Other'
};

export const SPORT_COLOR: Record<Sport, string> = {
	running: 'var(--color-running)',
	cycling: 'var(--color-cycling)',
	strength: 'var(--color-strength)',
	other: 'var(--color-other)'
};
