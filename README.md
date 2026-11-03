# Workout Planner

A personal training app: create an account, answer a few questions about your goals and current fitness, and get a 7-day workout plan built for you. Log every set, follow your rest timer, and track your consistency, strength and body weight over time.

## Features

- **Accounts** – email/password sign-up with secure, httpOnly session cookies.
- **Onboarding** – goals, body stats, experience & best lifts, schedule & equipment, injuries.
- **Plan generation** – an AI coach (OpenRouter or any OpenAI-compatible API). If the AI is unavailable, a built-in rule-based coach builds the plan instead.
- **Today** – today's workout with a progress ring, a per-set logger (reps + weight), a rest timer, and swap-an-exercise.
- **Plan** – the full week, with exercise detail pages (cues, progression notes, form videos and your history).
- **Progress** – weekly workouts, streak, sets, volume, strength trend per exercise, and body-weight tracking against your goal.
- **History** – every logged session; remove mistakes.
- **Settings** – edit any answer, rebuild the plan, log out, or delete your account.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `OPENROUTER_API_KEY` | API key for the AI coach. Leave it blank to use the built-in coach only. |
| `OPENROUTER_MODEL` | Model id, e.g. `openai/gpt-4o-mini`. |
| `OPENROUTER_BASE_URL` | Optional. Any OpenAI-compatible endpoint (defaults to OpenRouter). |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | Turso database. If these are blank, a local `local.db` file is used. |
| `AUTH_SECRET` | 32+ random characters used to sign sessions. |

Create a Turso database:

```bash
turso db create workout-planner
turso db show workout-planner --url        # -> TURSO_DATABASE_URL
turso db tokens create workout-planner     # -> TURSO_AUTH_TOKEN
```

Tables are created automatically on first run.

## Stack

Next.js 14 (App Router) · Tailwind CSS · Turso / libSQL · MUI X Charts · zod · jose · bcryptjs
