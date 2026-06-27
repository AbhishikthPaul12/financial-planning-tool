# GoalHorizon Backend | Planning Engine & REST API

This directory houses the backend server for **GoalHorizon**, built using Node.js, Express, and Mongoose.

It handles static React asset distribution, validates incoming request parameters, executes financial scenarios, generates monthly coordinates for charts, manages user registration/login session tokens, and persists simulation runs.

---

## 📐 Mathematical Financial Formulas

The backend's core business logic resides in [planningEngine.js](planningEngine.js). It implements two primary formulas:

### 1. Goal Cost Inflation (Compounded Annually)
To determine the future cost of a goal adjusted for inflation:
\[FutureTargetCost = TargetCost \times (1 + i)^t\]
*   \(TargetCost\): Initial cost.
*   \(i\): Annual inflation rate.
*   \(t\): Timeline in years.

### 2. Savings Accumulation (Monthly Compounded Return, Annuity Due)
Savings are compounding monthly with deposits made at the beginning of each period (annuity due):
\[FutureSavings = MonthlySavings \times \frac{(1 + r)^n - 1}{r} \times (1 + r)\]
*   \(MonthlySavings\): Recurring monthly deposit.
*   \(r\): Monthly interest rate (\(ExpectedReturn / 12 / 100\)).
*   \(n\): Total saving periods (\(Years \times 12\)).

---

## 🔒 Session Protection & Authentication

The backend implements JWT token-based authentication via an Express middleware in [middleware/auth.js](middleware/auth.js):
*   Extracts the token from the `Authorization: Bearer <token>` header.
*   Decodes the token to identify `req.user.id` and `req.user.username`.
*   Blocks unauthorized requests to simulated history, stats, and delete actions.

---

## 📡 API Endpoints Catalog

### 🔑 Authentication Routes (`/api/v1/auth`)
*   `POST /register`: Registers a new user account. Hashes the password using `bcryptjs` and returns a JWT token.
*   `POST /login`: Validates credentials against database/in-memory records and returns a JWT token.

### 📊 Simulation & History Routes (`/api/v1`)
*   `POST /analyze` (Protected): Runs projections across Conservative, Moderate, and Optimistic environments. Stores the run linked to the user's ID, and returns the calculations and monthly trajectory points.
*   `GET /history` (Protected): Retrieves up to 100 past simulation logs belonging to the authenticated user.
*   `GET /profile/stats` (Protected): Computes aggregate profile statistics (totals, averages, and outcomes) for the active user.
*   `DELETE /analyze/:id` (Protected): Deletes a single simulation log by ID.
*   `POST /analyze/delete-multiple` (Protected): Accepts an array of IDs to perform bulk simulation log deletions.

---

## 💾 Resilient Database Fallback
If MongoDB is offline during server startup, the connection catches the timeout error (set to 3 seconds) and sets a `useInMemory = true` flag. 

All user registrations, logins, history logging, and stats aggregation dynamically fall back to local in-memory session arrays. This guarantees:
1.  **Zero server crashes** or startup blocks.
2.  **Full local testing capability** of authentication and history logging even without a database.
