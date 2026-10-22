type ErrorLike = {
	message?: unknown;
	code?: unknown;
	body?: { message?: unknown; code?: unknown };
};

export function isKeyError(error: unknown): boolean {
	const e = error as ErrorLike | null;
	return e?.code === 'GARMIN_KEY_INVALID' || e?.body?.code === 'GARMIN_KEY_INVALID';
}

export function errorMessage(error: unknown): string {
	const e = error as ErrorLike | null;
	const message = e?.body?.message ?? e?.message;
	return typeof message === 'string' && message ? message : 'Something went wrong.';
}
