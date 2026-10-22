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
	error(401, 'Your Garmin API key is invalid or has expired.', { code: 'GARMIN_KEY_INVALID' });
}

function jwtExpiry(jwt: string): number | null {
	try {
		const payload = jwt.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
		const { exp } = JSON.parse(atob(payload));
		return typeof exp === 'number' ? exp * 1000 : null;
	} catch {
		return null;
	}
}

function parseToken(text: string): Token {
	const value = text.trim();
	if (!value) throw new Error('Garmin token response is empty');
	const expiresAt = jwtExpiry(value) ?? Date.now() + FALLBACK_TOKEN_TTL_MS;
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

	return parseToken(await response.text());
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
