## Project Configuration

- SvelteKit using runes, remote-functions
- TypeScript
- Tailwindcss

## Sport Priorities

The user's sports, in order of priority: Strength Training (Gym), Cycling, Running. Weigh features, charts and data coverage accordingly.

Strength training is the main focus, but the user does not use Garmin's strength tracking features (exercise sets, reps, weights). They treat the watch as a running timer that logs heart rate only, so expect duration and heart rate data for strength activities, nothing exercise-level.

## Charts

Charts use `@tanstack/charts`. When proposing or building a chart, don't limit yourself to the bar, line and dot charts already in the app: the library also has heatmaps, beeswarms, regressions, ridgelines, violins, box plots, waffles, difference areas, and more. Pick the type that fits the question the chart answers. Read the library's docs in `node_modules/@tanstack/charts/docs` (start with `reference/index.md`).

## Garmin API

The project integrates with the free Garmin Connect Personal API (personal use).

Sources:

- Overview and auth: https://developer.garmin.com/gc-developer-program/personal/personal-api/
- Swagger docs: https://developer.garmin.com/gc-developer-program/personal/swagger-docs/

There is no stable URL for the OpenAPI JSON. The Swagger page embeds the spec (OpenAPI 3.0.1, server `https://personal.connectapi.garmin.com`) in a hashed Gatsby JS chunk. To read it dynamically:

1. Fetch the swagger-docs page HTML and find the `/component---src-pages-gc-developer-program-personal-swagger-docs-js-<hash>.js` script URL (the hash changes on deploys).
2. Fetch that chunk and extract the string literal inside `JSON.parse('{"openapi":...}')`, then evaluate the literal and `JSON.parse` the result.

The spec lives at `src/lib/server/garmin/openapi.json`. After updating it, regenerate `schema.d.ts` with `pnpm run garmin:types`.

## Deployment

The app has no authentication of its own. It is expected to run behind a basic auth middleware (e.g. a reverse proxy), so don't add login or auth handling to the app.

## Git

Work on `main`, unless explicitly told to work on a feature branch.
Use conventional commit messages like 'feat:', 'fix:', 'chore:', ...

## Feedback Loop

Use `package.json` scripts over `pnpx` and `npx` commands.
Validate your changes with `pnpm run check`.

## Removing Features

Free resources that are no longer used. When removing a chart or feature, also remove the data fetching, queries and API calls behind it, even if the data is simply left unused.

## Testing

This is a template for vibe projects - you must not write any tests.

## README

Keep `README.md` in sync when a change alters what the app shows, how it works, or how to set it up. Update only the affected lines, keep it short, and don't turn it into a changelog or feature catalogue.

## Documentation

- Only add a comment when complexity is genuinely high **and** the naming does not already convey enough information.
- A comment that restates the function name, parameters, or return type is worthless — delete it. Well-named identifiers are the documentation.
- Never add a comment just because a function is public or exported.
- When a comment truly is warranted, prefer explaining _why_ over _what_, use JSDoc syntax, and keep it short and concise.

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
