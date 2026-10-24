# zone-0

A personal, read-only dashboard for your Garmin data. It pulls workouts, daily vitals and weight from the [Garmin Connect Personal API](https://developer.garmin.com/gc-developer-program/personal/personal-api/) and shows them in three pages:

- **Today**: resting heart rate, stress, body battery, intensity minutes, calories and respiration, each with a 4-week trend, plus this week's workouts.
- **Training**: the last 12 months of weekly volume per sport (running, cycling, strength, other), heart rate zones, training load, intensity minutes vs. goal, training effect, plus dedicated Strength, Cycling and Running sections with session and ride stats, heart rate zone shares (Strength and Cycling), charts and best efforts.
- **Body**: weight over the last 12 months against your weight goal, and fitness age.

Units, time zone and the first day of the week come from your Garmin profile settings.

## How it works

- Built with SvelteKit (Svelte 5 runes, async components, remote functions), TypeScript and Tailwind CSS. Charts use TanStack Charts with `d3-scale`.
- Activities and daily summaries are synced from Garmin into a local SQLite file (`node:sqlite`, `src/lib/server/garmin/store.ts`) under `DATA_DIR` (default `./data`). The first sync backfills 12 months; after that, pages render from the store straight away and the browser starts a sync in the background when the store is over 5 minutes old, updating the page when it finishes. These syncs only re-fetch the last few days. A full 12-month re-sync runs once a day to pick up older edits and deletions. Profile settings are stored too, so if Garmin can't be reached the stored data is still shown, with a notice.
- Remote functions (`src/lib/remote`) read from the store and aggregate into chart-ready arrays on the server. Other endpoints (weight, fitness age, today's summary) and profile settings are kept in an in-memory cache for 5 minutes to 1 hour.
- The API key is exchanged for a short-lived access token, which is refreshed when it expires or on a 401 (`src/lib/server/garmin/client.ts`).
- API types are generated from Garmin's OpenAPI spec (`src/lib/server/garmin/openapi.json`) with `openapi-typescript` and called through `openapi-fetch`. See `AGENTS.md` for how to refresh the spec.

## Setup

Requires Node 24 and pnpm.

1. Create a key on the [Garmin Connect Personal API](https://developer.garmin.com/gc-developer-program/personal/personal-api/) page.
2. Copy `.env.example` to `.env` and set `GARMIN_API_KEY`. `DATA_DIR` must point to a directory that persists across restarts; the Docker image uses `/data`, so mount a volume there.
3. Install and run:

```sh
pnpm install
pnpm run dev
```

Use `pnpm run check` and `pnpm run lint` to validate changes.
