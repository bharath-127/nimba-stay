# Nimba Stay

A front-desk room availability and booking tool for Nimba Nature Cure. Staff pick check-in and check-out dates, see which rooms are free for the whole stay and what it costs, enter the guest's details and book. The one rule everything is built around: **a room can never be booked twice for the same night**, even when two staff members book at the same moment.

Built for the Full Stack Developer — 1-Hour Build Assessment.

## Stack

- Frontend: React 19, Vite, Tailwind CSS v4 (JavaScript), Axios
- Backend: Node.js, Express 5, Zod validation
- Database: MongoDB with Mongoose 9
- Tests: Vitest, Supertest (API), Testing Library (React); a Postman collection for manual checks

## Run it

```bash
git clone <repo-url> nimba && cd nimba
npm run install:all
cp server/.env.example server/.env    # set MONGO_URI (Atlas URI recommended; a local standalone mongod works too)
cp client/.env.example client/.env
npm run seed                          # sample room types, rooms and one maintenance block
npm run dev                           # API on http://localhost:5000, app on http://localhost:5173
npm test                              # server + client suites
```

## What it does

- Search free rooms for a stay by dates and category, grouped by category with the price of the stay
- Book a guest (name and 10-digit phone) — `400` for bad input, `404` for an unknown room, `409` for a clash or a room out of service
- Cancel a booking; the nights are released immediately
- Early check-out frees the remaining nights so the room can be re-let the same day
- Maintenance blocks: take a room out of service for a period or until lifted; a block is refused while a guest is booked in that period
- Dashboard cards (total, available, out of service, confirmed) that follow the dates being searched

## The three rules

- **A guest leaving on 20 Nov does not block a guest arriving on 20 Nov.** Stays are half-open ranges `[checkIn, checkOut)`, so the check-out day is never an occupied night.
- **Cancelled bookings block nothing.** Cancelling deletes the booking's reserved nights.
- **Rooms under maintenance are never free.** Maintenance is a dated `RoomBlock` (open-ended until lifted); inactive rooms and inactive room types are never offered either.

## How I prevent double booking

I don't rely on "check availability, then insert" — that has a race window. Every occupied night is written as a `RoomNight` row `{ roomId, date }` under a **unique compound index**, so the database itself refuses a second reservation of the same room-night no matter how two requests interleave. On a replica set (MongoDB Atlas) the booking and its nights are written in one transaction; on a standalone `mongod` I fall back to inserting the nights first and compensating if anything fails. The concurrency tests fire 2 and 10 simultaneous requests for the same room and assert exactly one `201` and no duplicate or orphaned rows, in both modes.

Dates are stored as `YYYY-MM-DD` strings, so there are no timezone off-by-one bugs and the overlap query works directly on strings.

## API

All responses use `{ success, data }` or `{ success: false, error: { code, message, details? } }`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/availability?checkIn&checkOut&category` | rooms free for every night of the stay, with price |
| POST | `/api/bookings` | create a booking |
| PATCH | `/api/bookings/:id/cancel` | cancel and release nights |
| PATCH | `/api/bookings/:id/check-out` | early departure, frees remaining nights |
| GET | `/api/bookings` | latest bookings |
| GET | `/api/stats?checkIn&checkOut` | dashboard summary for a date range (tonight by default) |
| GET | `/api/rooms` | all rooms with rate, beds and active flag |
| GET | `/api/rooms/categories` | room types with rates |
| GET | `/api/rooms/blocks` | current and upcoming maintenance blocks |
| POST | `/api/rooms/:id/blocks` | block a room for a period |
| DELETE | `/api/rooms/blocks/:id` | lift a block |
| GET | `/api/health` | API + database health |

A Postman collection with assertions for each endpoint is in `postman/Nimba-Stay.postman_collection.json`.

## What works and what doesn't

Everything listed above works and is covered by tests. Known limitations:

- No authentication — the brief asked not to add it; this is meant to run on the venue's network.
- On a standalone MongoDB the fallback write path is not fully atomic: if the process dies between inserting the nights and the booking, orphan nights block the room until cleaned up. This can't happen on Atlas.
- A block and a booking for the same room created at the exact same instant can both pass their checks. Booking against booking is always safe.
- Room images are illustrations and room sizes are display-only values; the API has neither.
- The bookings list shows the latest entries only; no pagination.

## Tests

- Server: 136 tests in 10 files — unit (dates, pricing) and integration (availability, bookings, cancel, check-out, blocks, stats, health, concurrency). Run against both a standalone `mongod` and a local single-node replica set.
- Client: 92 component and unit tests.

```bash
npm run test:server
npm run test:client
```

## Tools I used

- **VS Code** with `node --watch` for the API and Vite's HMR for the UI, so every change showed up without restarts.
- **MongoDB Compass + mongosh** to prove the unique index behaves as needed before building on it, and to confirm my local instance was standalone (which is why the fallback exists).
- **Vitest + Supertest** for API and concurrency tests against a real database; **Testing Library** for component tests.
- **Postman** for manual exploration and as a handover artefact.
- **Vite + Tailwind** for fast UI iteration.

## Why MERN and not Next.js + TypeScript

The brief preferred Next.js with TypeScript. I went with React, Express and MongoDB in JavaScript because it's the stack I'm fastest and most confident in, and with a 1.5-hour limit I cared more about getting the booking rules right than matching the preferred stack. The service and model layers don't depend on the framework and would move into Next.js route handlers unchanged.
