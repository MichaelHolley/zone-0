# Plan: Garmin read-only dashboard

A personal, read-only dashboard for workouts, activity and daily health data from the Garmin Connect Personal API. Read `AGENTS.md` first; its rules (runes, remote functions, Tailwind, no tests, `pnpm run check`) apply.

## Scope

**In:** daily vitals (resting HR, stress, body battery, intensity minutes, calories), training for running, cycling and strength, weight.

**Out (deliberately):** sleep, HRV, steps, floors, swimming, nutrition, hydration, SpO2, menstrual cycle, per-activity detail pages, strength sets/reps/weights (strength counts as duration only), body composition beyond weight/BMI (weight is entered manually, no smart scale), hosting/Docker/auth (handled later), database.

## Decisions

| Topic | Decision |
| --- | --- |
| Data access | Live fetch from Garmin in server-side remote functions (`query` from `$app/server`). No database. |
| Caching | In-memory TTL cache on the server: today data ~5 min, history ~1 h. No refresh button; data refreshes on reload after expiry. |
| Types | Generate types from the OpenAPI spec with `openapi-typescript`; call the API with `openapi-fetch`. |
| Charts | `@tanstack/svelte-charts` (TanStack Charts). Scales from `d3-scale` (`scaleLog`, `scaleTime`, `scaleLinear`, `scaleBand`) are passed into `scales.x.scale` / `scales.y.scale`. Reference: https://tanstack.com/charts/catalog/charts/53-log-scale-scatter |
| Look | Light theme only, modern and lightweight: thin borders, whitespace, one accent colour plus a colour per sport. |
| Units / locale | From `GET /userprofile-service/userprofile/settings`: `measurementSystem` (`metric`, `statute_us`, `statute_uk`), `timeZone`, `firstDayOfWeek`. Cache 1 h. |
| "Today" | Computed in the profile `timeZone`, not the server's (the server will run in a UTC container later). |
| Pages | `/` Today, `/training` Training, `/body` Body, with a shared top nav. |

## Garmin API

- Base URL: `https://personal.connectapi.garmin.com`. All data endpoints are `GET`.
- The spec is currently at `.garmin-openapi.json` (repo root). See `AGENTS.md` for how to re-fetch it.
- Auth: `GARMIN_API_KEY` in `.env` (already in `.env.example`). Read it via `$env/dynamic/private` so a container can inject it at runtime.
  - Exchange the key for an access token: `POST /personalapitoken-service/personal-api/personal-api-key/token` with header `Authorization: ApiKey <key>`.
  - This token endpoint is **not** in the spec. Inspect its response once to find the token field, its expiry, and which header data calls need (most likely `Authorization: Bearer <token>`).
  - Keep the token in memory. Fetch a new one when it expires or on a 401.
  - If the key itself is rejected, show an error page that says the key is invalid or expired and links to the Garmin Connect Personal API key page.
- Units in responses: distance in metres, duration in seconds, speed in m/s, power in watts, weight and weight goals in **grams**, dates as `YYYY-MM-DD`, `startTimeLocal` as `yyyy-MM-dd HH:mm:ss` without an offset.

### Endpoints used

| Endpoint | Used for |
| --- | --- |
| `/userprofile-service/userprofile/settings` | Units, time zone, week start |
| `/usersummary-service/usersummary/daily?calendarDate=` | Today tiles (includes `restingHeartRate`, `lastSevenDaysAvgRestingHeartRate`, stress, body battery, intensity minutes + `intensityMinutesGoal`, calories) |
| `/usersummary-service/v2/dailysummaries?startDate=&endDate=` | Daily trends. Max range is 1 year. Per day: `heartRate.restingValue`, `stress.avgLevel/maxLevel`, `bodyBattery.min/max/charged/drained`, `intensityMinutes.moderate/vigorous/goal`, `calories.burnedActive/burnedTotal` |
| `/activitylist-service/activities/search/activities?startDate=&endDate=&start=&limit=` | All activity data. `limit` defaults to 99; page with `start += limit` until a page returns fewer than `limit` items. Keep `excludeChildren=true` (the default). |
| `/weight-service/weight/range/{startDate}/{endDate}` | Daily latest weight (+ BMI if present) |
| `/goal-service/goal/user/effective/weightgoal/{startDate}/{endDate}` | Weight goal (`goalValue`, grams) |

Sport grouping uses `activityType.typeKey` and `parentTypeId`. Group into **running**, **cycling**, **strength** and **other**. Check the real type keys (e.g. `running`, `trail_running`, `treadmill_running`, `cycling`, `road_biking`, `indoor_cycling`, `strength_training`) against your own data.

## Pages

### `/` Today

- **Tiles (today):**
  - Resting HR vs its 7-day average.
  - Stress: average and max.
  - Body battery: latest, high/low, charged/drained.
  - Intensity minutes this week vs the weekly goal.
  - Calories: active and total.
- **4-week trends:** one small chart per tile metric, built from `v2/dailysummaries` over the last 28 days. Uses `scaleTime` on x.
- **This week's workouts:** rows from the activity list, starting at the profile's `firstDayOfWeek`. Each row: date, sport colour/icon, name, duration, distance (if any), average HR, `trainingEffectLabel`.

### `/training` (last 12 months)

All charts are built from one 12-month activity list fetch (cached 1 h), plus `v2/dailysummaries` for intensity minutes.

- **Weekly volume:** stacked bars per week by sport for duration, plus distance for running and cycling, plus count.
- **Intensity & load:**
  - Weekly HR time-in-zone: stacked bars summing `hrTimeInZone_1..5`.
  - Weekly `activityTrainingLoad` sum.
  - Weekly intensity minutes (moderate + 2× vigorous, Garmin's rule) vs goal.
  - Average aerobic/anaerobic training effect per week.
- **VO2max:** line of `vO2MaxValue` over time, one series each for running and cycling, using activities that have a value.
- **Running bests table:** best `fastestSplit_1000`, `_1609`, `_5000`, `_10000`, `_21098`, `_42195` over the 12 months. Show time, pace (in profile units) and date. Hide rows with no data.
- **Cycling power curve:**
  - For each duration `d` in 1, 2, 5, 10, 20, 30, 60, 120, 300, 600, 1200, 1800, 3600, 7200 s, take the max `maxAvgPower_<d>` across cycling activities. Skip activities with `excludeFromPowerCurveReports`.
  - Draw a line + dots with x = seconds on `scaleLog().domain([1, 7200])`, y = watts on `scaleLinear`.
  - Tick labels: `1s 5s 30s 1m 5m 20m 1h 2h`.

### `/body` (last 12 months)

- Weight line from `weight/range` (latest weight per day), converted from grams to kg or lb.
- Dashed horizontal goal line from the weight goal, if one exists.
- Tiles: current weight, change over 30 days and over 12 months, BMI (when present).

## Suggested structure

```
src/lib/server/garmin/
  openapi.json        # moved from /.garmin-openapi.json
  schema.d.ts         # generated, do not edit
  client.ts           # openapi-fetch client + token handling
  cache.ts            # cached(key, ttlMs, fn)
  dates.ts            # today/week-start/ranges in profile time zone
src/lib/remote/
  today.remote.ts     # query() functions for the Today page
  training.remote.ts
  body.remote.ts
  profile.remote.ts
src/lib/format.ts     # duration, pace, distance, weight per measurementSystem
src/lib/components/   # Tile, ChartCard, chart components, Nav
src/routes/+layout.svelte, +page.svelte, training/+page.svelte, body/+page.svelte, +error.svelte
```

- Do aggregation (weekly buckets, bests, power curve) on the server inside the remote functions. Return small, chart-ready arrays to the client.
- Use `await` in components (`experimental.async` is enabled in `vite.config.ts`) with `<svelte:boundary>` for pending and error states.

## Implementation steps

1. **Dependencies:** `pnpm add @tanstack/svelte-charts d3-scale openapi-fetch` and `pnpm add -D openapi-typescript @types/d3-scale`.
   - The TanStack catalog examples are written for React. Check the Svelte adapter's component and import paths in the `@tanstack/svelte-charts` README (the core package also exports `@tanstack/charts/svelte`).
2. **Spec and types:**
   - Move `.garmin-openapi.json` to `src/lib/server/garmin/openapi.json`.
   - Add the script `"garmin:types": "openapi-typescript src/lib/server/garmin/openapi.json -o src/lib/server/garmin/schema.d.ts"` and run it.
   - Update `AGENTS.md` to say where the spec lives.
3. **Client:** token exchange, client, TTL cache and profile settings. Verify against the real API with a single call.
4. **Shared UI:** layout with nav, light theme tokens in `layout.css`, `Tile` and `ChartCard` components, format helpers.
5. **Today page.**
6. **Training page.**
7. **Body page.**
8. Run `pnpm run check` and `pnpm run lint` after each step. If the Svelte MCP is available, run `svelte-autofixer` on every component. Commit each step with a conventional commit message on `main`.

## Open points for the implementer

- Response shape of the token endpoint (see Auth).
- Real `typeKey` values in the account, for sport grouping.
- Whether `weight/range` daily entries include BMI. If not, drop the BMI tile.
