export const sum = (values: readonly number[]) => values.reduce((total, v) => total + v, 0);

export const average = (values: readonly number[]) =>
	values.length ? sum(values) / values.length : null;

export function median(values: readonly number[]) {
	if (!values.length) return null;
	const sorted = values.toSorted((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
