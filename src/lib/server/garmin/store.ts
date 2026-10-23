import { HOUR, MINUTE } from './cache';
import {
	fetchActivities,
	fetchDailySummaries,
	sportOf,
	type Activity,
	type DailySummary
} from './data';
import { addDays, type IsoDate } from './dates';
import { database } from './db';
import { getToday } from './settings';

const STALE_AFTER_MS = 5 * MINUTE;
const FULL_SYNC_EVERY_MS = 24 * HOUR;
const BACKFILL_DAYS = 365;
/** Re-fetch a few days before the newest stored entry to catch edits and late uploads. */
const OVERLAP_DAYS = 3;

export type SyncStatus = { syncedAt: number | null; failed: boolean };

let pendingSync: Promise<void> | null = null;
let lastAttemptAt = 0;
let lastSyncFailed = false;

function syncedAt(resource: 'sync' | 'fullSync'): number | null {
	const row = database()
		.prepare('SELECT syncedAt FROM sync_state WHERE resource = ?')
		.get(resource);
	return row ? Number(row.syncedAt) : null;
}

function latestDate(sql: string): IsoDate | null {
	const row = database().prepare(sql).get();
	return row?.date ? String(row.date).slice(0, 10) : null;
}

function inTransaction(fn: () => void) {
	const db = database();
	db.exec('BEGIN');
	try {
		fn();
		db.exec('COMMIT');
	} catch (error) {
		db.exec('ROLLBACK');
		throw error;
	}
}

async function runSync() {
	lastAttemptAt = Date.now();
	try {
		const { today } = await getToday();
		const full = (syncedAt('fullSync') ?? 0) < Date.now() - FULL_SYNC_EVERY_MS;
		const since = (latest: IsoDate | null) =>
			full ? addDays(today, -(BACKFILL_DAYS - 1)) : addDays(latest ?? today, -OVERLAP_DAYS);
		const activityStart = since(latestDate('SELECT max(startTimeLocal) AS date FROM activities'));
		const summaryStart = since(latestDate('SELECT max(calendarDate) AS date FROM daily_summaries'));

		const [activities, summaries] = await Promise.all([
			fetchActivities(activityStart, today),
			fetchDailySummaries(summaryStart, today)
		]);

		// Replacing the whole window, not upserting, drops activities deleted in Garmin.
		const db = database();
		const end = addDays(today, 1);
		inTransaction(() => {
			db.prepare('DELETE FROM activities WHERE startTimeLocal >= ? AND startTimeLocal < ?').run(
				activityStart,
				end
			);
			const insertActivity = db.prepare(
				'INSERT OR REPLACE INTO activities (activityId, startTimeLocal, sport, json) VALUES (?, ?, ?, ?)'
			);
			for (const a of activities) {
				if (a.activityId == null || !a.startTimeLocal) continue;
				insertActivity.run(a.activityId, a.startTimeLocal, sportOf(a), JSON.stringify(a));
			}

			db.prepare('DELETE FROM daily_summaries WHERE calendarDate >= ? AND calendarDate < ?').run(
				summaryStart,
				end
			);
			const insertSummary = db.prepare(
				'INSERT OR REPLACE INTO daily_summaries (calendarDate, json) VALUES (?, ?)'
			);
			for (const s of summaries) {
				if (s.calendarDate) insertSummary.run(s.calendarDate, JSON.stringify(s));
			}

			const setSyncedAt = db.prepare(
				'INSERT OR REPLACE INTO sync_state (resource, syncedAt) VALUES (?, ?)'
			);
			setSyncedAt.run('sync', lastAttemptAt);
			if (full) setSyncedAt.run('fullSync', lastAttemptAt);
		});
		lastSyncFailed = false;
	} catch (error) {
		lastSyncFailed = true;
		throw error;
	}
}

/**
 * Syncs with Garmin when the store is stale and resolves to whether new data was stored.
 * Failures are retried after the same threshold and only throw while the store is still empty.
 */
export async function syncStore(): Promise<boolean> {
	const lastSync = syncedAt('sync');
	if (lastSync === null || Math.max(lastSync, lastAttemptAt) < Date.now() - STALE_AFTER_MS) {
		pendingSync ??= runSync().finally(() => {
			pendingSync = null;
		});
	}
	if (!pendingSync) return false;
	try {
		await pendingSync;
		return true;
	} catch (error) {
		if (lastSync === null) throw error;
		return false;
	}
}

export function syncStatus(): SyncStatus {
	return { syncedAt: syncedAt('sync'), failed: lastSyncFailed };
}

/** Only the first sync blocks reads; later ones are started by the client after the page renders. */
async function initialSync() {
	if (syncedAt('sync') === null) await syncStore();
}

export async function getActivities(start: IsoDate, end: IsoDate): Promise<Activity[]> {
	await initialSync();
	return database()
		.prepare(
			'SELECT json FROM activities WHERE startTimeLocal >= ? AND startTimeLocal < ? ORDER BY startTimeLocal'
		)
		.all(start, addDays(end, 1))
		.map((row) => JSON.parse(String(row.json)));
}

export async function getDailySummaries(start: IsoDate, end: IsoDate): Promise<DailySummary[]> {
	await initialSync();
	return database()
		.prepare(
			'SELECT json FROM daily_summaries WHERE calendarDate >= ? AND calendarDate <= ? ORDER BY calendarDate'
		)
		.all(start, end)
		.map((row) => JSON.parse(String(row.json)));
}
