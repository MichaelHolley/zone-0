import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DATA_DIR } from '$app/env/private';

let db: DatabaseSync | null = null;

export function database(): DatabaseSync {
	if (db) return db;
	mkdirSync(DATA_DIR, { recursive: true });
	db = new DatabaseSync(join(DATA_DIR, 'zone-0.db'));
	db.exec(`
		CREATE TABLE IF NOT EXISTS activities (
			activityId INTEGER PRIMARY KEY,
			startTimeLocal TEXT NOT NULL,
			sport TEXT NOT NULL,
			json TEXT NOT NULL
		);
		CREATE INDEX IF NOT EXISTS activities_startTimeLocal ON activities (startTimeLocal);
		CREATE TABLE IF NOT EXISTS daily_summaries (
			calendarDate TEXT PRIMARY KEY,
			json TEXT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS sync_state (
			resource TEXT PRIMARY KEY,
			syncedAt INTEGER NOT NULL
		);
		CREATE TABLE IF NOT EXISTS settings (
			id INTEGER PRIMARY KEY CHECK (id = 1),
			json TEXT NOT NULL
		);
	`);
	return db;
}
