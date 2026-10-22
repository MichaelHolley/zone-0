import { error } from '@sveltejs/kit';
import createClient, { type Middleware } from 'openapi-fetch';
import { GARMIN_API_KEY } from '$app/env/private';
import type { paths } from './schema';

const BASE_URL = 'https://personal.connectapi.garmin.com';
const TOKEN_URL = `${BASE_URL}/personalapitoken-service/personal-api/personal-api-key/token`;
const FALLBACK_TOKEN_TTL_MS = 30 * 60_000;
const EXPIRY_MARGIN_MS = 60_000;

type Token = { value: string; expiresAt: number };

let token: Token | null = null;
let pendingToken: Promise<Token> | null = null;

function keyRejected(): never {
	error(401, {
		message: 'Your Garmin API key is invalid or has expired.',
		code: 'GARMIN_KEY_INVALID'
	});
}

/**
 * The token endpoint is not part of the OpenAPI spec, so accept the common
 * field spellings and fall back to a conservative lifetime.
 */
function parseToken(body: unknown): Token {
	if (typeof body === 'string' && body.trim()) {
		return { value: body.trim(), expiresAt: Date.now() + FALLBACK_TOKEN_TTL_MS };
	}
	if (typeof body !== 'object' || body === null) {
		throw new Error('Garmin token response is empty');
	}
	const record = body as Record<string, unknown>;
	const value = [record.access_token, record.accessToken, record.token].find(
		(v): v is string => typeof v === 'string' && v.length > 0
	);
	if (!value) throw new Error('Garmin token response has no token field');

	const expiresIn = Number(record.expires_in ?? record.expiresIn);
	const expiresAtRaw = record.expires_at ?? record.expiresAt ?? record.expiration;
	let expiresAt = Date.now() + FALLBACK_TOKEN_TTL_MS;
	if (Number.isFinite(expiresIn) && expiresIn > 0) {
		expiresAt = Date.now() + expiresIn * 1000;
	} else if (typeof expiresAtRaw === 'number') {
		expiresAt = expiresAtRaw < 1e12 ? expiresAtRaw * 1000 : expiresAtRaw;
	} else if (typeof expiresAtRaw === 'string' && !Number.isNaN(Date.parse(expiresAtRaw))) {
		expiresAt = Date.parse(expiresAtRaw);
	}
	return { value, expiresAt: expiresAt - EXPIRY_MARGIN_MS };
}

async function requestToken(): Promise<Token> {
	if (!GARMIN_API_KEY) keyRejected();

	const response = await fetch(TOKEN_URL, {
		method: 'POST',
		headers: { Authorization: `ApiKey ${GARMIN_API_KEY}` }
	});
	if (response.status === 400 || response.status === 401 || response.status === 403) keyRejected();
	if (!response.ok) throw new Error(`Garmin token request failed with ${response.status}`);

	const text = await response.text();
	let body: unknown = text;
	try {
		body = JSON.parse(text);
	} catch {
		// plain-text token
	}
	return parseToken(body);
}

async function accessToken(forceRefresh = false): Promise<string> {
	if (!forceRefresh && token && token.expiresAt > Date.now()) return token.value;

	pendingToken ??= requestToken().finally(() => {
		pendingToken = null;
	});
	token = await pendingToken;
	return token.value;
}

const auth: Middleware = {
	async onRequest({ request }) {
		request.headers.set('Authorization', `Bearer ${await accessToken()}`);
		return request;
	},
	async onResponse({ request, response }) {
		if (response.status !== 401) return response;
		const retry = new Request(request);
		retry.headers.set('Authorization', `Bearer ${await accessToken(true)}`);
		const retried = await fetch(retry);
		if (retried.status === 401) keyRejected();
		return retried;
	}
};

export const garmin = createClient<paths>({ baseUrl: BASE_URL });
garmin.use(auth);

export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
	if (result.data === undefined) {
		throw new Error(`Garmin request ${result.response.url} failed with ${result.response.status}`);
	}
	return result.data;
}
