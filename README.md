# Nimba Stay

This is my submission for the Full Stack Developer build assessment.

It's a small front-desk tool for Nimba Nature Cure. The receptionist picks check-in and check-out dates, sees which rooms are free for the whole stay and what it will cost, types in the guest's name and phone number, and books. The main thing I had to get right: a room must never be booked twice for the same night, even if two people at the desk click "Book" at the same moment.

## Stack

I used the MERN stack because that's what I'm most comfortable with (more on that at the bottom).

- React 19 + Vite + Tailwind v4, plain JavaScript
- Node + Express 5, Zod for validation
- MongoDB with Mongoose 9
- Vitest + Supertest for the API tests, Testing Library for the React side
- A Postman collection in `postman/` if you prefer clicking through the endpoints

## Running it

```bash
git clone <repo-url> nimba
cd nimba
npm run install:all
cp server/.env.example server/.env   # put your MongoDB URI in MONGO_URI
cp client/.env.example client/.env
npm run seed                         # creates the sample rooms (one of them is under maintenance)
npm run dev                          # API on :5000, app on :5173
```

An Atlas connection string is the best option because transactions work there. A normal local `mongod` works too, the server just logs that it's running in fallback mode (explained below).

`npm test` runs both test suites. The server tests need the `MONGO_URI_TEST` database from `.env.example`; they wipe it between tests.

## What it does

- Search free rooms for a date range, optionally filtered by category. Results are grouped by category with the total price for the stay.
- Book a guest. Bad input gets a `400` (phone has to be exactly 10 digits, check-out has to be after check-in), unknown room `404`, clash or room out of service `409`.
- Cancel a booking. The nights are freed straight away.
- Check a guest out early. The remaining nights are freed so the room can be given to someone else the same day.
- Block a room for maintenance, for a date range or until someone lifts it. You can't block a room that has a guest booked in that period, it tells you who's in the way.
- The cards at the top (total rooms, available, out of service, confirmed bookings) follow whatever dates you searched for.

## The three rules from the brief

**Leaving on 20 Nov doesn't block someone arriving on 20 Nov.** I treat a stay as the range `[checkIn, checkOut)`, so the check-out day is never counted as an occupied night. No special case needed, it just falls out of the model.

**Cancelled bookings block nothing.** Cancelling deletes the booking's reserved nights, so there's nothing left to block anyone.

**Maintenance rooms are never free.** Maintenance is a `RoomBlock` with a start date and an optional end date. Blocked rooms, inactive rooms and inactive room types are all filtered out before availability is even calculated.

## How I stop double bookings

The obvious way is "check if the room is free, then insert the booking". The problem is two requests can both pass the check before either inserts. I tried to avoid that completely.

Every occupied night is stored as its own row in a `roomnights` collection, `{ roomId, date }`, with a unique index on those two fields. So if two requests try to reserve the same room for the same night, MongoDB itself rejects the second one. It doesn't matter how the requests are timed. That `E11000` error is turned into a `409`.

On a replica set (Atlas) the booking and its nights are inserted in one transaction. On a standalone `mongod` transactions aren't available, so I insert the nights first and then the booking, and delete the nights again if anything fails. The unique index protects both paths.

There's a concurrency test that fires 2 and then 10 identical requests at once and checks that exactly one gets a `201` and there are no duplicate or leftover rows. I ran the whole suite on my local standalone MongoDB and on a single-node replica set I started on another port, to make sure both paths actually work.

One more small thing: dates are stored as `YYYY-MM-DD` strings rather than Date objects. It avoids timezone off-by-one problems and the overlap query works directly on strings.

## Endpoints

Every response is `{ success, data }` or `{ success: false, error: { code, message, details } }`.

| Method | Path | What it does |
|---|---|---|
| GET | `/api/availability?checkIn&checkOut&category` | rooms free for every night, with price |
| POST | `/api/bookings` | create a booking |
| PATCH | `/api/bookings/:id/cancel` | cancel, frees the nights |
| PATCH | `/api/bookings/:id/check-out` | early check-out, frees the remaining nights |
| GET | `/api/bookings` | recent bookings |
| GET | `/api/stats?checkIn&checkOut` | numbers for the dashboard cards |
| GET | `/api/rooms` | all rooms |
| GET | `/api/rooms/categories` | room types and rates |
| GET | `/api/rooms/blocks` | current and upcoming blocks |
| POST | `/api/rooms/:id/blocks` | block a room |
| DELETE | `/api/rooms/blocks/:id` | lift a block |
| GET | `/api/health` | API and database status |

## What works and what doesn't

Everything above works and has tests. Things I know are missing or imperfect:

- No login. The brief said not to add auth, so the assumption is this runs on the venue's own network.
- On a standalone MongoDB, if the server crashed in the middle of a booking (between writing the nights and the booking itself) you'd get orphan nights blocking that room until someone cleaned them up. Can't happen on Atlas because it's one transaction there.
- If a maintenance block and a booking for the same room are created at the exact same instant, both checks can pass. Booking vs booking is always safe, this is only block vs booking.
- The room pictures are drawn illustrations, not photos, and the square footage shown on the cards is a fixed value per category. The API doesn't have either.
- The bookings list only shows the most recent ones, there's no pagination.

## Tests

Server: 136 tests across 10 files. Unit tests for the date and pricing helpers, integration tests for availability, bookings, cancel, check-out, blocks, stats, health and the concurrency case.

Client: 92 tests for the components and helpers.

```bash
npm run test:server
npm run test:client
```

## Tools I used

- VS Code, with `node --watch` on the API and Vite's hot reload on the UI.
- MongoDB Compass and mongosh. Before writing any code I created the unique index by hand and tried inserting clashing rows to make sure it behaved the way I expected. That's also how I found out my local instance was standalone, which is why the fallback path exists.
- Vitest and Supertest for testing against a real database instead of mocks. Testing Library for the React components.
- Postman for poking at the API while building it. The collection is in the repo.
- Vite and Tailwind, mostly for speed.

## Why not Next.js and TypeScript

The brief said Next.js with TypeScript was preferred. I went with React + Express + MongoDB in JavaScript because it's the stack I'm fastest in, and with the time limit I'd rather spend it getting the booking rules right than fighting a framework I'm less fluent in. The service and model code doesn't depend on Express at all, so moving it into Next.js route handlers wouldn't change much.
