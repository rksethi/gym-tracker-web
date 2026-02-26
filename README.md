# GymTracker Web

A web-based gym workout tracker built with **React**, **TypeScript**, **Tailwind CSS**, and **Express + SQLite**.

## Features

- **Start Workout** — begin empty or from a saved template
- **Log Sets Inline** — add exercises, enter weight/reps, mark sets complete
- **Optional Heart Rate** — manually enter max heart rate per exercise
- **100 Preset Exercises** — organized by category (Push, Pull, Legs, Shoulders, Arms, Core, Cardio, Full Body)
- **Custom Exercises** — add your own exercises to the library
- **Workout Templates** — create reusable routines with multiple exercises
- **History & Stats** — browse past sessions grouped by month with volume tracking
- **Live Timer** — real-time elapsed time during active workouts
- **Responsive** — works on desktop and mobile

## Quick Start

```bash
npm install
npm run dev
```

This starts both the Express API (port 3001) and the Vite dev server (port 5173).
Open [http://localhost:5173](http://localhost:5173) in your browser.

## Production

```bash
npm run build
npm start
```

This builds the React frontend and serves it via Express on port 3001.

## Stack

| Layer    | Technology                      |
|----------|---------------------------------|
| Frontend | React 18, TypeScript, Tailwind  |
| Backend  | Express.js, Node.js             |
| Database | SQLite (via better-sqlite3)     |
| Bundler  | Vite                            |

## API Endpoints

| Method | Path                              | Description                   |
|--------|-----------------------------------|-------------------------------|
| GET    | /api/exercises                    | List all exercises            |
| POST   | /api/exercises                    | Create custom exercise        |
| GET    | /api/sessions                     | List completed sessions       |
| POST   | /api/sessions                     | Create new session            |
| GET    | /api/sessions/:id                 | Get session with all data     |
| PUT    | /api/sessions/:id                 | Update session                |
| DELETE | /api/sessions/:id                 | Delete session                |
| POST   | /api/sessions/:id/entries         | Add exercises to session      |
| PUT    | /api/entries/:id                  | Update entry (heart rate)     |
| DELETE | /api/entries/:id                  | Remove exercise from session  |
| POST   | /api/entries/:id/sets             | Add set to entry              |
| PUT    | /api/sets/:id                     | Update set                    |
| DELETE | /api/sets/:id                     | Delete set                    |
| GET    | /api/templates                    | List templates                |
| POST   | /api/templates                    | Create template               |
| DELETE | /api/templates/:id                | Delete template               |

## Project Structure

```
workout-app-web/
├── server/
│   ├── index.js        # Express API server + DB schema
│   └── seed.js         # 100 preset exercises
├── src/
│   ├── main.tsx        # React entry point
│   ├── App.tsx         # Router setup
│   ├── api.ts          # API client
│   ├── types.ts        # TypeScript types + helpers
│   ├── index.css       # Tailwind imports
│   ├── components/
│   │   └── Layout.tsx  # Shell with nav
│   └── pages/
│       ├── Home.tsx
│       ├── ActiveWorkout.tsx
│       ├── Library.tsx
│       ├── History.tsx
│       ├── SessionDetail.tsx
│       └── Templates.tsx
├── package.json
├── vite.config.ts
└── tailwind.config.js
```
