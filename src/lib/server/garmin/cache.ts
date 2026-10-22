const store = new Map<string, { expiresAt: number; value: Promise<unknown> }>();

export function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
	const hit = store.get(key);
	if (hit && hit.expiresAt > Date.now()) return hit.value as Promise<T>;

	const value = fn();
	const entry = { expiresAt: Date.now() + ttlMs, value };
	store.set(key, entry);
	value.catch(() => {
		if (store.get(key) === entry) store.delete(key);
	});
	return value;
}

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
