export const sum = (values: readonly number[]) => values.reduce((total, v) => total + v, 0);

export const average = (values: readonly number[]) =>
	values.length ? sum(values) / values.length : null;
