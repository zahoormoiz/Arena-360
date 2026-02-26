# Arena360 - Project Overview & Technical Architecture

## Project Overview

### What problem this project solves
Arena360 is a seamless booking platform for sports facilities. It solves the problem of manual scheduling and double-bookings by providing a real-time, digital solution for users to reserve courts/fields and for facility owners to manage their schedule and revenue.

### Who it is built for
- **Users (Customers)**: People who want to browse available sports, check slot availability, and book sessions instantly (with or without an account).
- **Admins (Facility Owners)**: Managers who need a dashboard to oversee daily bookings, view revenue analytics, manage sport details, and control slot availability.

### Core features and workflows
- **Booking Flow**: Users select a sport -> detailed slot selection (date/time/duration) -> checkout (guest or logged in) -> confirmation.
- **Admin Dashboard**: Visual analytics (revenue/bookings charts), list of recent bookings with status filtering.
- **Dynamic Pricing**: (Implied) Backend supports different prices per sport.
- **Authentication**: Secure login/signup for persistent user history, with guest checkout support for friction-less bookings.

---

## High-Level Architecture

### Frontend vs Backend responsibilities
The project is built as a **Monolith** using Next.js, but logically separated:
- **Frontend (Client)**: React components (`src/components`), Pages (`src/app`), and Styles. Handles UI state, animations (`framer-motion`), and user interactions.
- **Backend (Server)**: Next.js API Routes (`src/app/api`). Acts as the REST API layer handling logic, database connections, and validation.

### How data flows from UI → API → Database
1.  **UI**: User clicks "Book Now". usage `fetch` or a query library call `POST /api/bookings`.
2.  **API Route**: The request hits `src/app/api/bookings/route.ts`.
3.  **Controller/Service**: The route validates input (using Zod or manual checks), calls helper services (e.g., `bookingService`).
4.  **Database**: Mongoose models (`src/models/Booking.ts`) execute the query against MongoDB.
5.  **Response**: JSON data is returned to the UI for rendering.

### Authentication & authorization flow
1.  **Login**: User posts credentials to `/api/auth/login`.
2.  **Token Issuance**: Server verifies password (bcrypt), signs a JWT (using `jose`), and sets it as an **HttpOnly cookie** (`auth-token`).
3.  **Route Protection**: `src/proxy.ts` (acts as Middleware) intercepts requests:
    -   Public routes (e.g., `/api/sports`) -> Allowed.
    -   Protected routes (e.g., `/my-bookings`) -> Verifies JWT from cookie.
    -   Admin routes (`/admin/*`) -> Verifies JWT **and** checks `role: 'admin'`.

---

## Technology Stack

### Frontend framework & libraries
-   **Next.js 16 (React 19)**: The core meta-framework. Chosen for its server-side rendering (SEO) and unified full-stack capabilities.
-   **Tailwind CSS 4**: For styling. Chosen for rapid UI development and modern utility-first approach.
-   **Framer Motion**: For animations. Adds premium feel (transitions, hover effects).
-   **Lucide React**: For icons. consistent, clean SVG icons.

### Backend framework
-   **Next.js App Router**: Used as the backend.
    -   *Role*: Handles API endpoints, headers, and response formats. Simplifies deployment (no separate backend server to manage).

### Database & ORM
-   **MongoDB**: NoSQL database.
    -   *Why*: Flexible schema fits booking data (documents with varying fields) effectively.
-   **Mongoose**: ODM (Object Data Modeling) library.
    -   *Role*: Defines strict schemas (`src/models`) to ensure data consistency (e.g., Booking must have a price).

### Authentication system
-   **Custom JWT (jose + bcryptjs)**:
    -   *Why*: Full control over the auth flow without external dependencies like Auth0/Clerk. `jose` is a lightweight library for JWTs in edge-compatible environments.
    -   *Role*: `bcryptjs` for password hashing; `jose` for signing/verifying tokens.

### APIs & server communication
-   **REST API**: Simple JSON-based endpoints defined in `src/app/api`.
-   **Middleware**: Custom `proxy.ts` implementations for centralized security checks.

### Hosting & deployment
-   **Vercel (Recommended)**: Native Next.js support.
-   **Environment variables**: Managed via `.env.local` for sensitive keys.

---

## Folder & File Structure

| Folder | Purpose |
| :--- | :--- |
| `src/app` | **Routing Core**. Folders here become URLs (e.g., `app/login/page.tsx` -> `/login`). |
| `src/app/api` | **Backend API**. Endpoints for data (e.g., `api/bookings`, `api/auth`). |
| `src/components` | **Reusable UI**. Buttons, Modals, navbars, cards. |
| `src/lib` | **Utilities**. Shared logic like `db.ts` (DB connect) and `auth.ts` (JWT helpers). |
| `src/models` | **DB Schemas**. Mongoose model definitions (`User.ts`, `Booking.ts`). |
| `src/proxy.ts` | **Middleware Logic**. Contains the rule engine for route protection. |

**Important Files**:
-   `src/lib/db.ts`: Manages MongoDB connection caching (critical for dev environment performance).
-   `src/lib/auth.ts`: Centralizes security logic (hash, sign, verify).

---

## Core Systems Breakdown

### Authentication (login/signup/session)
-   **Signup**: Creates a User document. Hashes password before saving.
-   **Session**: Stateless JWT session. The server doesn't store "active sessions", it just validates the signature of the token on every request.

### User management
-   **Models**: `User` model distinguishes between `role: 'user'` and `role: 'admin'`.
-   **Guest Support**: The system supports bookings *without* a user ID, storing guest contact info directly on the Booking document.

### Business logic (bookings)
-   **Booking Creation**: 
    1.  Validate inputs (Date/Time).
    2.  Check for conflicts (Query existing bookings for same Sport + Time).
    3.  Calculate Duration/Price.
    4.  Create record.
-   **Availability**: Uses database indexes to quickly scan if a slot is taken.

### Error handling & validation
-   **Validation**: Input is validated at the API boundaries (checking for missing fields, invalid dates).
-   **Error Responses**: Standardized JSON error format `{ success: false, error: "message" }`.

---

## Performance & Security

### How performance is optimized
-   **Database Indexes**: `BookingSchema.index({ sport: 1, date: 1, startTime: 1 })` ensures availability checks are instant, even with millions of records.
-   **Global DB Cache**: `db.ts` implements a caching pattern to prevent connection limits from being hit during hot-reloads in development.
-   **React Server Components**: Reducing client-side JavaScript bundle size by rendering static content on the server.

### How security is handled
-   **HttpOnly Cookies**: Prevents client-side scripts (XSS attacks) from stealing the auth token.
-   **Password Hashing**: Passwords are never stored plain-text.
-   **Role Guards**: Admin endpoints double-check `payload.role === 'admin'` to prevent privilege escalation.

---

## How to Run the Project

1.  **Install Dependencies**: `npm install`
2.  **Setup Environment**: Create `.env.local` in root:
    ```
    MONGODB_URI=mongodb://localhost:27017/arena360
    JWT_SECRET=your_super_secret_key
    ```
3.  **Run Development Server**: `npm run dev`
4.  **Access**:
    -   App: `http://localhost:3000`
    -   API: `http://localhost:3000/api/...`

---

## Scalability & Future Improvements

### How this project can scale
-   **Stateless Auth**: JWTs allow horizontal scaling (multiple servers can verify tokens without a shared session DB).
-   **Separation of Concerns**: The API is decoupled from the UI, so a Mobile App could reuse the same backend.

### What can be improved (Future Roadmap)
-   **Transactions**: Wrap booking creation in MongoDB Transactions to ensure absolute data integrity during high concurrency.
-   **Payment Integration**: Replace mock payment logic with real Stripe/PayPal webhooks.
-   **Advanced Analytics**: Move aggregation logic from JS (Array.reduce) to MongoDB Aggregation Pipeline for better performance on large datasets.
