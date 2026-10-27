# HotelPro - Hotel Management System

A full-stack MERN application for managing hotel rooms, bookings, check-in/check-out and payments.

**Stack:** React (Vite) + Bootstrap 5, Node.js + Express, MongoDB (Mongoose), JWT authentication.

## Features
- Register / login with JWT and role-based access (guest, staff, admin)
- Room search by dates and guest count with real-time availability (no double booking)
- Booking, cancellation, and simulated payment (UPI / card / cash)
- Staff: view all bookings, check-in and check-out guests
- Admin: dashboard stats (occupancy, revenue), add / delete rooms, set maintenance

## Project structure
```
hotelpro/
├── server/   Express API (config, models, middleware, routes, seed.js)
└── client/   React app (pages, components, context, api.js)
```

## Setup
Requirements: Node.js 16+, npm 8+, MongoDB running locally (or a MongoDB Atlas URI).

### 1. Backend
```bash
cd server
npm install
# edit .env if needed (MONGO_URI, JWT_SECRET)
npm run seed      # creates demo users and rooms
npm run dev       # http://localhost:5000
```

### 2. Frontend
```bash
cd client
npm install
npm run dev       # http://localhost:5173
```

## Demo logins (created by `npm run seed`)
| Role  | Email               | Password  |
|-------|---------------------|-----------|
| Admin | admin@hotelpro.com  | Admin@123 |
| Staff | staff@hotelpro.com  | Staff@123 |
| Guest | guest@hotelpro.com  | Guest@123 |

## API overview
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/auth/register, /api/auth/login | Public |
| GET | /api/auth/me | Logged in |
| GET | /api/rooms, /api/rooms/available | Public |
| POST/PUT/DELETE | /api/rooms | Admin |
| POST | /api/bookings | Logged in |
| GET | /api/bookings/my | Logged in |
| GET | /api/bookings | Staff, Admin |
| PUT | /api/bookings/:id/cancel | Owner, Staff, Admin |
| PUT | /api/bookings/:id/checkin, /checkout | Staff, Admin |
| POST | /api/payments | Booking owner |
| GET | /api/payments | Admin |
| GET | /api/admin/stats | Staff, Admin |

Protected routes need the header `Authorization: Bearer <token>` (test them in Postman).

## Security notes
Passwords are hashed with bcrypt, JWTs are verified on every protected route, public sign-up can only create guests, and secrets live in `.env` (not committed).
