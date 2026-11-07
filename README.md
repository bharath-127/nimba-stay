# Nimba Stay

Front-desk room availability and booking system for **Nimba Nature Cure & Holistic Centre**.
Staff pick dates and a category, see which rooms are free for the *whole* stay with the total price, enter the guest's details and book. **A room can never be booked twice for the same night** — not even under concurrent requests.

Built for the *Full Stack Developer — 1-Hour Build Assessment*.

---

## Table of contents

1. [Project overview](#1-project-overview)
2. [Problem statement](#2-problem-statement)
3. [Features](#3-features)
4. [Technology stack](#4-technology-stack)
5. [Project folder structure](#5-project-folder-structure)
6. [Architecture](#6-architecture)
7. [Database models](#7-database-models)
8. [API documentation](#8-api-documentation)
9. [MongoDB Atlas setup](#9-mongodb-atlas-setup)
10. [Environment variables](#10-environment-variables)
11. [Installation](#11-installation)
12. [Backend startup](#12-backend-startup)
13. [Frontend startup](#13-frontend-startup)
14. [Database seed](#14-database-seed)
15. [Testing](#15-testing)
16. [Completed functionality](#16-completed-functionality)
17. [Known limitations](#17-known-limitations)
18. [Tools used and how they helped](#18-tools-used-and-how-they-helped)
19. [Why MERN instead of the preferred stack](#19-why-mern-instead-of-the-preferred-stack)
20. [Design notes vs. the production Nimba codebase](#20-design-notes-vs-the-production-nimba-codebase)

---

## 1. Project overview

| | |
|---|---|
| **Product** | Nimba Stay — a single front-desk screen for checking availability and booking guests |
| **Organisation** | Nimba Nature Cure, Mehsana, Gujarat |
| **Users** | Front-desk / reception staff |
| **Core guarantee** | No double booking of a room-night, enforced by the database |
| **Stack** | React + Vite + Tailwind · Node + Express · MongoDB + Mongoose |

## 2. Problem statement

Front-desk staff need to answer two questions quickly and correctly:

1. *Which rooms are free for these dates (optionally in this category), and what will the stay cost?*
2. *Book this guest into that room — and make sure nobody else gets the same room for the same nights.*

The assignment defines three rules that make this harder than it looks:

- A guest **leaving on 20 Nov does not block** a guest **arriving on 20 Nov** (check-out day is free).
- **Cancelled bookings block nothing.**
- Rooms with status **`maintenance` are never free.** (Here maintenance is a **dated block** on the room — a period with a reason, open-ended until lifted — so a room can be out of service for a known time and come back automatically.)

And one requirement that is easy to get subtly wrong: two simultaneous requests for the same room and overlapping dates must never both succeed.

## 3. Features

**Front desk screen**
- Property summary cards — total rooms, available, out of service, confirmed bookings — all from `GET /api/stats`. **They describe the dates being searched** (tonight before a search) and refresh after every booking, cancellation, check-out or block change
- Check-in / check-out date pickers with instant validation (check-out must be after check-in, max 90 nights)
- Category filter populated from the API's room types, with their rates (nothing hardcoded in the UI)
- Available rooms **grouped by category, most expensive first**, each with nightly rate, beds, nights, total stay price and availability badge
- **Book now** opens an accessible side panel (full-screen on phones): guest details → **review** of guest, room, dates and total → confirm. Nothing is sent until the review is confirmed; a 409 replaces *Confirm* with *Choose another room*
- Booking confirmation with reference, guest, room, dates, nights and total
- Recent bookings with status badges (icon + colour + text: *Confirmed* / *Checked out* / *Cancelled*) and a stay phase (*Upcoming* / *In-house* / *Checked out*), a table on desktop and cards on phones, a two-step inline **Check out** for guests in house (frees the remaining nights) and **Cancel** for confirmed stays
- **Maintenance blocks** panel: take a room out of service for a period (or until lifted) with a reason, see current and upcoming blocks, lift them; blocking is refused while a guest is booked in the period, and the guests in the way are listed
- Live API indicator in the header: *API online* / *Database offline* / *API offline*, re-checked every 15 s, on tab focus, on reconnect and on click
- Loading skeletons, empty states, field-level validation errors, API error banners, conflict banner with a *Refresh availability* action, network-failure handling, double-submit protection, automatic list refresh after booking / cancelling
- Responsive layout, accessible labelled inputs, `aria-live` regions, keyboard-navigable

**API**
- `GET /api/availability` — rooms free for every night of the stay, grouped by category, with the stay price
- `POST /api/bookings` — validated, price computed server-side from the room type's rate, `400` / `404` / `409`
- `PATCH /api/bookings/:id/cancel` — releases every night · `PATCH /api/bookings/:id/check-out` — early departure releases the remaining nights
- `GET /api/stats?checkIn=&checkOut=` — summary for a stay range (or tonight)
- `GET /api/rooms`, `GET /api/rooms/categories`, `GET /api/rooms/blocks`, `POST /api/rooms/:id/blocks`, `DELETE /api/rooms/blocks/:id`
- `GET /api/bookings`, `GET /api/health`
- Consistent JSON envelope, central error handling, CORS allow-list, Helmet, request logging

## 4. Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, JavaScript (ES2022+), Tailwind CSS v4, Axios, React hooks |
| Backend | Node.js 24, Express 5, JavaScript (ESM), Zod (validation), Helmet, CORS, Morgan |
| Database | MongoDB 9 / MongoDB Atlas, Mongoose 9, compound unique index, multi-document transactions |
| Testing | Vitest, Supertest (API), Testing Library (React), Postman collection |

## 5. Project folder structure

```
nimba/
├── client/                         React front end (Vite)
│   ├── public/favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── availability/       SearchForm, RoomList (grouped), RoomCard (+ tests)
│   │   │   ├── booking/            BookingPanel (drawer: details → review → confirmed), BookingForm,
│   │   │   │                       BookingReview, BookingSuccess, StaySummary, RecentBookings, BookingStatusBadge (+ tests)
│   │   │   ├── dashboard/StatsCards.jsx   summary cards for the searched dates (+ test)
│   │   │   ├── rooms/RoomBlocksCard.jsx   maintenance blocks: create / list / lift (+ test)
│   │   │   ├── layout/Header.jsx   brand + live API health pill (+ test)
│   │   │   └── ui/                 Button, Input, Select, Alert, Badge, Card, Drawer, EmptyState, Spinner
│   │   ├── hooks/                  useAvailability, useCreateBooking, useBookings, useBlocks, useStats, useCategories, useHealth
│   │   ├── pages/DashboardPage.jsx  the single front-desk screen (owns the flow state)
│   │   ├── services/               api.js (Axios + ApiError), availability/booking/room services
│   │   ├── utils/                  dates, format, validation (+ tests)
│   │   ├── test/setup.js
│   │   ├── App.jsx · App.css · main.jsx · index.css (Tailwind theme)
│   ├── index.html · vite.config.js · package.json · .env.example
│
├── server/                         Express API
│   ├── config/                     env.js (dotenv + validation), db.js (connect, transaction detection)
│   ├── models/                     RoomType.js, Room.js, RoomBlock.js, Booking.js, RoomNight.js, index.js (ensureIndexes)
│   ├── controllers/                availabilityController, bookingController, roomController, statsController
│   ├── routes/                     availabilityRoutes, bookingRoutes, roomRoutes, statsRoutes, index
│   ├── services/                   availabilityService, bookingService, roomTypeService, roomBlockService, statsService
│   ├── validators/schemas.js       Zod schemas for query / body / params
│   ├── middleware/                 validate, errorHandler, notFound
│   ├── utils/                      dates, pricing, constants, AppError, mongoErrors
│   ├── tests/
│   │   ├── unit/                   dates.test.js, pricing.test.js
│   │   ├── integration/            availability, bookings, cancel, checkout, blocks, stats, health, concurrency
│   │   └── helpers/setup.js
│   ├── app.js · server.js · seed.js · vitest.config.js · package.json · .env.example
│
├── postman/Nimba-Stay.postman_collection.json
├── package.json                    root scripts (run both apps, seed, test)
├── .gitattributes · .gitignore
└── README.md
```

## 6. Architecture

### Request flow

```
Browser ──Axios──▶ Express
                    ├─ helmet · cors (allow-list) · express.json · morgan
                    ├─ route ─▶ validate(zod) ─▶ controller ─▶ service ─▶ Mongoose models
                    └─ notFound ─▶ errorHandler  →  { success:false, error:{ code, message, details? } }
```

- **Routes** declare the endpoint and attach validation.
- **Controllers** translate HTTP ↔ service calls. No business logic.
- **Services** hold every business rule (availability, pricing, conflict handling, cancellation).
- **Models** define schemas, constraints and — critically — the indexes.
- **utils/dates.js** is pure and unit-tested; the overlap rule and the half-open night expansion live there.

### Dates are calendar days, stored as `YYYY-MM-DD` strings

A booking night is a calendar day, not an instant. Storing dates as ISO strings removes the entire class of timezone off-by-one bugs (`new Date('2026-11-20')` is UTC midnight, which is the 19th in some timezones). Because ISO date strings sort lexicographically in chronological order, the overlap predicate works directly on strings in MongoDB (`$lt` / `$gt`).

### Room types, blocks, pricing, early check-out

- **`RoomType`** is the category (`Deluxe`, `Suite`, …) and **owns the nightly rate**. Changing a tariff is one update; every booking snapshots the rate it was made at. An inactive type is never offered.
- **`Room`** has a number, a category, a bed count and `isActive`. Inactive rooms are never offered.
- **`RoomBlock`** is how maintenance works: a half-open period `[startDate, endDate)` with a reason; `endDate: null` means *until someone lifts it*. A block is refused while a confirmed guest is booked in the period (the guests are returned in the error), so blocking can never strand anyone.
- **Pricing:** a stay is charged for its actual nights — `nights × pricePerNight`, 1 night = 1 night's rate (`utils/pricing.js`). Responses carry `chargedNights`, which equals `nights`; `MIN_CHARGED_NIGHTS` in `utils/constants.js` (currently `1`) is the single switch should a minimum-night policy ever be wanted.
- **Early check-out:** `PATCH /bookings/:id/check-out` sets `status: checked_out` and `checkedOutOn`, and deletes the `RoomNight` rows from that day on, so the room can be re-let the same day. Nights already stayed are kept.

### Availability (`availabilityService.findAvailableRooms`)

1. Candidate rooms: `isActive` rooms whose type is active, optional `category` (an unknown category is a `400` that lists the valid ones).
2. Held rooms (`heldRoomIds`), the union of three indexed lookups:
   - the standard overlap predicate on stays — `existing.checkIn < requested.checkOut AND existing.checkOut > requested.checkIn` — for **confirmed** bookings, and for **checked-out** bookings using `checkedOutOn` as the end, checked against the whole range, not just the first night;
   - the `RoomNight` lock table for the requested nights, so the screen never offers a room the unique index would reject at booking time;
   - `RoomBlock`s overlapping the range.
3. Return the rest **grouped by category, most expensive first**, each room priced from its type's rate × charged nights.

`GET /api/stats` reuses this function for the searched dates, so the summary cards can never disagree with the room list.

### Booking conflict prevention (`bookingService.createBooking`)

The naive approach — query for an overlap, then insert if none — has a race window: two requests can both pass the check and both insert. **This implementation does not depend on that check at all.**

Every occupied night of a stay is written as a `RoomNight` document `{ roomId, bookingId, date }`, and the collection carries a **unique compound index on `{ roomId, date }`**. The database itself therefore refuses a second reservation of the same room-night; two concurrent requests can never both succeed, whatever their timing. The duplicate-key error (`E11000`) is translated into `409 ROOM_ALREADY_BOOKED`.

Because a stay is expanded as the half-open range `[checkIn, checkOut)`, the check-out day is never a reserved night, so *"leaving on the 20th does not block arriving on the 20th"* falls out of the data model with no special-case code. Cancelling a booking deletes its `RoomNight` rows and sets `status: 'cancelled'`, which is why cancelled bookings block nothing.

**Transactions.** When the deployment is a replica set (MongoDB Atlas, or a local replica set) the `Booking` insert and the `RoomNight.insertMany` run inside **one transaction** (`session.withTransaction`). A duplicate night aborts the transaction and nothing is left behind. The server detects this at startup (`hello.setName`) and logs `Transactions: ENABLED`.

When the deployment is a standalone `mongod` (which cannot run transactions) the service uses a **compensating-write fallback**: insert the nights first, then the booking; if either step fails, the nights are deleted. The unique index guarantees correctness in both modes; the transaction additionally guarantees that no partial data can ever be observed. Both paths are exercised by the test suite.

### Error handling

One middleware maps every error to the envelope: `AppError` (operational), Zod issues → `400 VALIDATION_ERROR` with per-field `details`, Mongoose `CastError`/`ValidationError` → `400`, malformed JSON → `400`, duplicate key → `409`, anything else → `500` with a generic message (stack traces are logged server-side only).

## 7. Database models

### `roomtypes`

| Field | Type | Notes |
|---|---|---|
| `name` | String | required, **unique** — the category, e.g. `Deluxe` |
| `pricePerNight` | Number | ≥ 0, INR — the rate every room of this type is priced at |
| `isActive` | Boolean | default `true`; inactive types are never offered |

### `rooms`

| Field | Type | Notes |
|---|---|---|
| `roomNumber` | String | required, **unique**, upper-cased, e.g. `DLX-201` |
| `category` | String | required — the `RoomType.name` |
| `bedCount` | Number | ≥ 1, default 2 |
| `isActive` | Boolean | default `true`; inactive rooms are never offered |
| `createdAt`, `updatedAt` | Date | timestamps |

Indexes: `roomNumber` unique · `{ isActive, category, roomNumber }`

### `roomblocks`

| Field | Type | Notes |
|---|---|---|
| `roomId` | ObjectId → Room | required |
| `startDate` | String | `YYYY-MM-DD`, first blocked night |
| `endDate` | String \| null | `YYYY-MM-DD`, first free night; `null` = until lifted |
| `reason` | String | ≤ 200 chars, default `Maintenance` |

Indexes: `{ roomId, startDate, endDate }`. Overlap with a stay: `startDate < checkOut AND (endDate IS null OR endDate > checkIn)`.

### `bookings`

| Field | Type | Notes |
|---|---|---|
| `roomId` | ObjectId → Room | required |
| `guestName` | String | 2–80 chars, trimmed |
| `phone` | String | exactly 10 digits |
| `checkIn`, `checkOut` | String | `YYYY-MM-DD`; model also enforces `checkOut > checkIn` |
| `nights` | Number | derived, ≥ 1 |
| `chargedNights` | Number | `= nights` (would exceed it only if `MIN_CHARGED_NIGHTS` were raised above 1) |
| `pricePerNight` | Number | snapshot of the room type's rate at booking time |
| `totalPrice` | Number | `chargedNights × pricePerNight`, computed on the server |
| `status` | String | enum `confirmed` · `checked_out` · `cancelled` (default `confirmed`) |
| `checkedOutOn`, `checkedOutAt` | String \| Date | set on check-out; `checkedOutOn` is the first night the room is free again |
| `createdAt`, `updatedAt` | Date | timestamps |

Indexes: `{ roomId, status, checkIn, checkOut }` and `{ roomId, status, checkIn, checkedOutOn }` (overlap queries) · `{ createdAt: -1 }`

### `roomnights`

| Field | Type | Notes |
|---|---|---|
| `roomId` | ObjectId → Room | required |
| `bookingId` | ObjectId → Booking | required |
| `date` | String | `YYYY-MM-DD`, one document per occupied night |

Indexes: **`{ roomId, date }` unique (`uniq_room_night`)** — the double-booking guard · `{ bookingId }` for cancellation

Relationships: `RoomType 1 — * Room`, `Room 1 — * RoomBlock`, `Room 1 — * Booking`, `Booking 1 — * RoomNight`. Referenced rather than embedded because bookings grow without bound and are queried independently of rooms. `ensureIndexes()` runs on every startup so the unique index always exists before traffic is accepted.

## 8. API documentation

Base URL: `http://localhost:5000/api` (configurable). All responses are JSON.

Success: `{ "success": true, "data": … }` · Failure: `{ "success": false, "error": { "code", "message", "details"? } }`

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | `200` when the API **and** MongoDB are up (with transaction mode); `503 DATABASE_UNAVAILABLE` when the database is unreachable |
| GET | `/stats?checkIn=&checkOut=` | summary for a stay range (or `?date=` for one night, or nothing for tonight): `totalRooms`, `activeRooms`, `inactiveRooms`, `maintenanceRooms`, `availableRooms`, `occupiedRooms`, `confirmedBookings`, `currentOrUpcomingBookings`, `inHouseTonight`. *Available* reuses the availability query for the same range, so it always agrees with a search |
| GET | `/rooms/categories` | active room types with rates, cheapest first |
| GET | `/rooms` | every room with rate, beds and active flag |
| GET | `/rooms/blocks?includeEnded=` | blocks in effect or upcoming |
| POST | `/rooms/:id/blocks` | `{ startDate, endDate?, reason? }` — `201`; `409 BLOCK_CONFLICTS_WITH_BOOKINGS` (with the guests) when someone is booked in the period |
| DELETE | `/rooms/blocks/:blockId` | lift: a block not yet started is removed, one in effect is ended today |
| GET | `/availability?checkIn=&checkOut=&category=` | free rooms grouped by category with the stay price |
| POST | `/bookings` | create a booking |
| GET | `/bookings?limit=20` | latest bookings (newest first) |
| PATCH | `/bookings/:id/cancel` | cancel and release every night (idempotent; `409` after check-out) |
| PATCH | `/bookings/:id/check-out` | `{ date? }` (default today) — early departure releases the nights from that day (idempotent; `409` before check-in or after cancellation) |

### `GET /api/availability`

```
GET /api/availability?checkIn=2026-11-20&checkOut=2026-11-23&category=Deluxe
```

```json
{
  "success": true,
  "data": {
    "checkIn": "2026-11-20", "checkOut": "2026-11-23", "nights": 3, "chargedNights": 3, "minChargedNights": 3,
    "category": "Deluxe", "count": 2,
    "groups": [
      { "category": "Deluxe", "pricePerNight": 5500, "nights": 3, "chargedNights": 3, "totalPrice": 16500, "count": 2,
        "rooms": [
          { "id": "6aeef3…", "roomNumber": "DLX-201", "category": "Deluxe", "bedCount": 2,
            "pricePerNight": 5500, "nights": 3, "chargedNights": 3, "totalPrice": 16500, "status": "available" }
        ] }
    ],
    "rooms": [ "…the same rooms, flat, in group order…" ]
  }
}
```

Groups are ordered most expensive first. A 1-night search returns `nights: 1, chargedNights: 1` and one night's rate as the total.

`400 VALIDATION_ERROR` when a date is missing or invalid, check-out is not after check-in, the stay exceeds 90 nights, or the category is unknown (the message lists the valid categories).

### `POST /api/bookings`

```json
{ "roomId": "6aeef3…", "guestName": "Asha Mehta", "phone": "9876543210",
  "checkIn": "2026-11-20", "checkOut": "2026-11-23" }
```

`201 Created`
```json
{ "success": true, "data": {
  "id": "6aeef4…", "roomId": "6aeef3…", "room": { "id": "6aeef3…", "roomNumber": "DLX-201", "category": "Deluxe" },
  "guestName": "Asha Mehta", "phone": "9876543210", "checkIn": "2026-11-20", "checkOut": "2026-11-23",
  "nights": 3, "chargedNights": 3, "pricePerNight": 5500, "totalPrice": 16500, "status": "confirmed",
  "checkedOutOn": null, "checkedOutAt": null, "createdAt": "2026-11-07T09:35:05.555Z" } }
```

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | name < 2 chars, phone not exactly 10 digits, invalid/missing dates, check-out ≤ check-in, > 90 nights, malformed `roomId` |
| 400 | `INVALID_JSON` | body is not valid JSON |
| 404 | `ROOM_NOT_FOUND` | `roomId` does not exist |
| 409 | `ROOM_UNAVAILABLE` | room blocked for any night of the stay (message names the end date and reason), room inactive, or its type inactive |
| 409 | `ROOM_ALREADY_BOOKED` | any night of the stay is already reserved |

Example `400`:
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid request",
  "details": [ { "field": "phone", "message": "Phone number must be exactly 10 digits" } ] } }
```

Example `409`:
```json
{ "success": false, "error": { "code": "ROOM_ALREADY_BOOKED",
  "message": "This room is no longer available for the selected dates" } }
```

### `PATCH /api/bookings/:id/cancel`

`200` with the booking (`status: "cancelled"`). `404 BOOKING_NOT_FOUND` for an unknown id, `400` for a malformed id, `409 BOOKING_ALREADY_CHECKED_OUT` once the guest has left. Calling it twice is safe.

### `PATCH /api/bookings/:id/check-out`

Body `{ "date": "2026-11-21" }` (optional; default today). `200` with `status: "checked_out"` and `checkedOutOn`; the room's nights from that day are released, so the next guest can arrive the same day. Leaving on or after the planned check-out frees nothing extra. `409 BOOKING_NOT_STARTED` before check-in, `409 BOOKING_CANCELLED` for a cancelled booking. Idempotent.

### `POST /api/rooms/:id/blocks`

Body `{ "startDate": "2026-12-01", "endDate": "2026-12-05", "reason": "Plumbing repair" }` (`endDate` optional = until lifted; `reason` default `Maintenance`). `201` with the block; the room disappears from availability for those nights and booking it returns `409 ROOM_UNAVAILABLE`. `409 BLOCK_CONFLICTS_WITH_BOOKINGS` lists the guests booked in the period. `DELETE /api/rooms/blocks/:blockId` lifts it (`lifted: "removed" | "ended-today" | "already-ended"`).

A ready-to-import **Postman collection** with assertions for every case is in [`postman/Nimba-Stay.postman_collection.json`](postman/Nimba-Stay.postman_collection.json). Run *Availability → Deluxe rooms* first (it stores a `roomId`), then *Create booking* twice to see the `409`.

## 9. MongoDB Atlas setup

1. Create a free cluster at <https://cloud.mongodb.com> (M0 is a 3-node replica set, so transactions are enabled).
2. **Database Access** → add a database user with read/write access.
3. **Network Access** → add your IP (or `0.0.0.0/0` for a short-lived demo).
4. **Connect → Drivers** → copy the connection string and put it in `server/.env`:
   ```
   MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/nimba_stay?retryWrites=true&w=majority
   ```
5. Start the server. The log line `Transactions: ENABLED` confirms the transactional booking path is active (`GET /api/health` also reports `"transactions": "enabled"`).

**Local alternative.** A standalone local MongoDB (`mongodb://127.0.0.1:27017/nimba_stay`) works too; the server logs `Transactions: NOT AVAILABLE … using compensating-write fallback`. To get transactions locally, run `mongod` with `--replSet rs0` and `rs.initiate()` once.

## 10. Environment variables

`server/.env` (copy from [`server/.env.example`](server/.env.example)):

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | API port |
| `NODE_ENV` | `development` | `test` is set automatically by the test runner |
| `CLIENT_ORIGIN` | `http://localhost:5173` | comma-separated CORS allow-list |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/nimba_stay` | main database (Atlas URI recommended) |
| `MONGO_URI_TEST` | `mongodb://127.0.0.1:27017/nimba_stay_test` | wiped by the test suite — must contain "test" |

`client/.env` (copy from [`client/.env.example`](client/.env.example)):

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` | where the React app sends requests |
| `VITE_PORT` | `5173` | dev-server port (optional) |

Real `.env` files are git-ignored. Never commit credentials.

## 11. Installation

Requirements: Node.js ≥ 20 (developed on 24), npm ≥ 10, MongoDB (Atlas or local ≥ 6).

```bash
git clone <repo-url> nimba
cd nimba
npm run install:all          # installs root, server and client dependencies
cp server/.env.example server/.env
cp client/.env.example client/.env
# edit server/.env with your MongoDB connection string
```

## 12. Backend startup

```bash
npm run seed                 # once — creates the sample rooms
npm run dev:server           # http://localhost:5000  (node --watch)
```

Production: `cd server && npm start`.

Smoke check: `curl http://localhost:5000/api/health`

## 13. Frontend startup

```bash
npm run dev:client           # http://localhost:5173
```

Or run both together from the root: `npm run dev`.

Production build: `cd client && npm run build` → static files in `client/dist`.

## 14. Database seed

```bash
npm run seed                 # idempotent: inserts what doesn't exist, never modifies existing records
npm run seed -- --reset      # wipes room types, rooms, blocks, bookings and room-nights, then seeds
```

| Rooms | Type (₹ / night) | Beds | State |
|---|---|---|---|
| STD-101, STD-102, STD-103 | Standard (3,500) | 1 / 2 / 2 | in service |
| DLX-201, DLX-202 | Deluxe (5,500) | 2 | in service |
| **DLX-203** | Deluxe (5,500) | 2 | **blocked** since 2026-01-01, until lifted — never offered |
| PRM-301, PRM-302 | Premium (8,500) | 2 | in service |
| STE-401, STE-402 | Suite (12,000) | 2 / 3 | in service |

## 15. Testing

```bash
npm test                     # server + client
npm run test:server          # Vitest + Supertest against MONGO_URI_TEST
npm run test:client          # Vitest + Testing Library (jsdom)
```

### Server — 135 tests, 10 files (all passing)

| File | Covers |
|---|---|
| `unit/dates.test.js` | ISO date validation (incl. 30 Feb, leap years), day arithmetic across month/year, night counting, **half-open night expansion** (check-out day excluded), the overlap predicate for identical / partial / inside / containing / adjacent ranges, and a 2 000-case property check that *overlap predicate ⇔ night-set intersection* |
| `unit/pricing.test.js` | actual-night charging (1 = 1, no minimum policy on; an explicit minimum still works), `chargedNights × rate`, rounding, invalid inputs |
| `integration/availability.test.js` | valid / same-day / inverted / invalid / missing dates → 400; unknown category → 400 listing the valid ones; > 90 nights → 400; the blocked seed room excluded; **grouping by category, most expensive first**; category filter; price from the type's rate; a 1-night stay priced at one night; a changed tariff reflected at once; **Rule 3** for a block overlapping any night, a block outside the stay (not hidden), an open-ended block, an inactive room, an inactive type; room held for identical / partial / inside / containing ranges; later-night clash still blocks; **check-out day free (Rule 1)**; **cancelled booking blocks nothing (Rule 2)**; early check-out frees only the remaining nights; cards agree with the search |
| `integration/bookings.test.js` | 201 shape incl. `chargedNights`; one `RoomNight` per night; 1-night stay charged for 1 night and reserving 1; **client-supplied price ignored (Rule 9)**; rate snapshot survives a tariff change; phone 9 / 11 digits, letters, spaces, country code, empty, missing → 400 (Rule 5); same-day, inverted, invalid, missing dates → 400 (Rule 4); short/blank name → 400; malformed id → 400; unknown room → 404; malformed JSON → 400; **Rule 3** blocked (seeded, dated with end date named, adjacent blocks allowed), inactive room, inactive type → 409 with no data left behind; conflicts for same / partial / inside / containing → 409 (Rule 6) with no partial data; Rule 1 both directions → 201; cancelled then re-book → 201; next guest arrives on the early check-out day → 201, the night before → 409; different room same dates → 201; list ordering and limit validation |
| `integration/cancel.test.js` | nights released, room bookable again, idempotent, 409 after check-out, 404, 400 |
| `integration/checkout.test.js` | early departure releases nights from that day and keeps the stayed night; room re-lettable from that day but not before; on/after planned check-out frees nothing; default date = today; 409 before check-in; 409 for cancelled; idempotent; id and date validation |
| `integration/blocks.test.js` | rooms and room types listing; seeded block listed with its room; ended blocks hidden unless asked; create a dated block → hidden from availability and 409 on booking; open-ended default; **refused with the guests listed** when someone is booked in the period; adjacent periods allowed; allowed after an early check-out; date/id validation; lifting a future block removes it, lifting one in effect ends it today; 404 / 400 |
| `integration/stats.test.js` | summary for a **stay range**; a stay inside the range; the same booking invisible to ranges it does not touch (Rule 1 both ways); cancel releases (Rule 2); early check-out frees the remaining nights; a block overlapping the range counted and excluded, a block outside not (Rule 3); inactive rooms; single-date and default-tonight forms; `inHouseTonight` independent of the range; half-given / inverted / invalid → 400 |
| `integration/health.test.js` | 200 with database connected; 503 `DATABASE_UNAVAILABLE` after disconnecting MongoDB |
| `integration/concurrency.test.js` | **Rule 7:** 2 simultaneous identical requests → exactly `[201, 409]`; 10 simultaneous overlapping requests → exactly one 201; no duplicate `(roomId, date)` rows and no orphaned rows; different rooms in parallel all succeed |

The suite was executed against **both** deployment types:

| Deployment | Write path | Result |
|---|---|---|
| Standalone `mongod` 9.0.4 (127.0.0.1:27017) | compensating-write fallback | 135 / 135 passed |
| Single-node replica set `rs0` (127.0.0.1:27018) | `withTransaction` | 80 / 80 passed (the original suite, run before the stats / health / blocks / check-out suites were added) |

### Client — 66 tests, 9 files (all passing)

`validation.test.js` (search + guest rules, phone variants) · `SearchForm.test.jsx` (render with room-type rates, submit, local validation, loading) · `RoomCard.test.jsx` (fields incl. beds, select, selected state) · `BookingForm.test.jsx` (summary, local validation, trimmed payload, server field errors, prefill) · `BookingPanel.test.jsx` (accessible dialog + initial focus, review shows guest/room/dates/total before sending, invalid phone blocked, edit keeps values, exact confirm payload, 409 → *Choose another room*, 400 → back to details with field error, network error retryable, no close/resubmit while in flight, Escape) · `StatsCards.test.jsx` (API figures rendered verbatim, **labels and range follow the searched dates / tonight**, skeleton, error + retry, stale data kept on refresh error) · `RecentBookings.test.jsx` (phase helpers, badges for confirmed / checked out / cancelled, early-departure note, **check-out only for in-house guests**, cancel only for confirmed stays, two-step confirms, mobile cards) · `RoomBlocksCard.test.jsx` (list, active-rooms-only picker, local validation, exact create payload, conflict details with the guests, two-step lift, empty state) · `Header.test.jsx` (online / database offline / API offline, click re-check and recovery, 15 s polling).

### Manual end-to-end (real browser against the running stack)

Verified in the browser with the API on a standalone MongoDB: categories loaded from the API · search (all categories, then Standard) · correct nights and totals · select room → guest form with server totals · invalid phone blocked locally · booking confirmed with reference · room list auto-refreshed (booked room gone) · recent bookings updated · **stale-snapshot conflict**: room booked through the API behind the UI, then booked from the UI → 409 banner with *Refresh availability* → list re-synced · cancel from the table frees the room.

## 16. Completed functionality

- [x] `GET /api/availability` with whole-stay check, category filter, maintenance exclusion, cancelled-ignored, total price, full validation
- [x] `POST /api/bookings` with 400 / 404 / 409, server-side pricing, every night reserved
- [x] Double-booking prevention by unique index; transaction when supported, compensating fallback otherwise; duplicate-key handling
- [x] Cancellation that releases nights
- [x] Idempotent seed with a maintenance room; `--reset` option
- [x] React dashboard: search, results, selection, guest form, confirmation, recent bookings, cancel; loading / empty / error / conflict / network states; double-submit guard; auto-refresh; responsive; accessible
- [x] Central error middleware, consistent envelope, CORS allow-list, Helmet, env config, no secrets in git
- [x] Summary cards from live data, booking side panel with review step, status indicators, responsive bookings list, live API/database health indicator
- [x] Room types owning the rate, dated maintenance blocks (create / list / lift, refused while guests are booked), inactive rooms and types, early check-out that frees the remaining nights, availability grouped by category, summary cards that follow the searched dates
- [x] 201 automated tests (server 135, client 66), Postman collection
- [x] Git history with incremental commits

## 17. Known limitations

- **Fallback mode is not fully atomic.** On a standalone MongoDB, if the process dies between inserting the nights and inserting the booking, orphan `RoomNight` rows block those nights until removed (`db.roomnights.deleteMany({ bookingId: { $nin: db.bookings.distinct('_id') } })`). This cannot happen on Atlas / a replica set, where the two writes are one transaction.
- A `409` does not say *which* night clashed. For a front desk, "no longer available for these dates — refresh" is the useful message.
- No authentication. The brief is a front-desk tool and asks not to add auth; the API is intended to run behind the venue's network.
- Past check-in dates are accepted (front desks backfill walk-ins). Easy to restrict in `validators/schemas.js`.
- Phone validation is strict: exactly 10 digits, no spaces or `+91`.
- Room categories and tariffs are sample data (Nimba's real tiers are Rajmukha / Pramukha / Sumukha / Amukha; the seed uses the generic Standard / Deluxe / Premium / Suite named in the task).
- **Blocks are not in the night index.** A block and a booking for the same room created in the same instant can both pass their checks (the booking checks blocks, the block checks bookings, but neither takes a lock). Bookings against bookings remain impossible to double; this edge only affects a block racing a booking and is visible in the blocks list. Materialising block nights into `RoomNight` would close it at the cost of bounding open-ended blocks.
- Early check-out does not recalculate the bill; the guest is charged as booked.
- The recent-bookings list shows the latest 10; there is no pagination, search or edit.
- No rate limiting.

## 18. Tools used and how they helped

| Tool | How it helped |
|---|---|
| **Claude (Anthropic) via Claude Code** — AI pair-programmer | Scaffolded the project, generated the bulk of the application, test and documentation code from an architecture I reviewed and approved first, ran the commands, and verified results in a real browser. I directed the design decisions (night-level unique index, transaction + fallback, ISO date strings) and reviewed every file. It also caught two real bugs during verification: Mongoose 9 removed the `next` callback from middleware (the first booking insert returned 500), and a stale-closure bug in the React conflict handler. |
| **MongoDB 9 + mongosh** | Before building on it, I proved on the actual database that a unique compound index behaves as required (overlapping night rejected with `E11000`, non-overlapping accepted, cancelled rows released), and confirmed the local deployment is standalone — which is why the transaction fallback exists. A throwaway single-node replica set on port 27018 was used to run the full suite through the transaction path. |
| **Vitest + Supertest** | Fast API tests against a real MongoDB, including the concurrency tests that fire simultaneous requests through Express. |
| **Testing Library** | Component tests that interact with the UI the way a user does (labels, roles, alerts). |
| **Postman** | Collection with assertions for every status code, used for manual exploration and handed over as a deliverable. |
| **Vite + Tailwind v4** | Instant HMR during UI work; design tokens in CSS keep the palette consistent. |
| **Zod** | One schema per endpoint gives field-level error details for free and keeps controllers free of validation code. |
| **Git** | Incremental commits per phase (backend → tests → client), so the history reads as the build progressed. |

## 19. Why MERN instead of the preferred stack

The brief lists **Next.js + TypeScript** as the *preferred* stack. I chose **React + Express + MongoDB in JavaScript** deliberately:

- It is the stack I am fastest and most confident in, and the assessment is explicit that *a plain screen that works beats a pretty one that double-books a room*. Correctness under a time limit mattered more than matching a preference.
- A separate Express API makes the booking logic, the transaction handling and the concurrency tests easy to exercise directly with Supertest and Postman, independent of any rendering framework.
- MongoDB was a natural fit for the night-level reservation model and lets the double-booking guarantee live in the database as a unique index.

The architecture does not depend on the framework: the service and model layers would move unchanged into Next.js route handlers, and the React components would work as-is.

## 20. Design notes vs. the production Nimba codebase

Nimba's real system (Postgres + Prisma, tRPC, Next.js) models the same problem. This build mirrors its design where that strengthens the front-desk flow, and deliberately departs where the assignment's rules or the MERN stack call for it.

| Production design | This build |
|---|---|
| `RoomType` owns the nightly rate and an active flag | Same: `roomtypes` collection, rate per type, snapshotted on each booking |
| `Room` with number, type, bed count, active flag | Same (`bedCount`, `isActive`); the unused `status` text field is not reproduced |
| Maintenance as a dated `RoomBlock` with a reason, open-ended until lifted | Same: `roomblocks` with `[startDate, endDate)` and `endDate: null`; plus a guard that refuses a block while guests are booked |
| Clash: `checkIn < newEnd AND checkOut > newStart`, half-open | Same predicate, same half-open ranges (Rule 1) |
| Cancelled allocations ignored | Same, and their reserved nights are physically released (Rule 2) |
| Blocked and inactive rooms never free | Same (Rule 3) |
| Early check-out frees the room; expired payment holds free it | Early check-out implemented (`checked_out`, `checkedOutOn`). **Payment holds are not** — this tool has no online payment step |
| Free rooms grouped by type, most expensive first | Same (`groups` in the availability response) |
| Re-check the room inside the booking transaction → 409 | Stronger: every room-night is a row under a **unique index**, so the database itself refuses a second reservation — no check-then-insert window at all |
| Beds allocated one by one (patient + attendant share a room) | **Not implemented.** The assignment's rule is *a room is never booked twice for the same night*; bed-level sharing would contradict it |
| Minimum 3 charged nights | **Not applied:** stays are charged for actual nights, since the assignment defines the total as the price of the stay. `MIN_CHARGED_NIGHTS` (`utils/constants.js`) is the single switch if the policy is wanted; `chargedNights` is already in every price |
| Separate full booking page | Replaced by the side panel — the brief asks for one screen |
| Gap: `claimRoom()` takes no lock, so two staff can double-book | Closed here. Postgres would use `pg_advisory_xact_lock` per room or an exclusion constraint; MongoDB has neither, so the guarantee is a **unique `{ roomId, date }` index** — timing-independent, and proven by the concurrency tests in both transaction and fallback modes |
