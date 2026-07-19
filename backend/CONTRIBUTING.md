# Contributing to CarbonIQ Backend

Thank you for your interest in contributing! This guide covers everything you need to get a local development environment running.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 22 LTS |
| npm | 10+ |
| MongoDB | 7+ (local) or MongoDB Atlas |
| Docker & Docker Compose | optional, recommended |

---

## Local Setup (without Docker)

```bash
# 1. Clone the repo and navigate to the backend
git clone https://github.com/your-org/carboniq.git
cd carboniq/backend

# 2. Install dependencies
npm install

# 3. Copy and configure environment variables
cp .env.example .env
# Edit .env and fill in MONGO_URI, JWT_SECRET, SMTP_* values

# 4. Start a local MongoDB instance (if not using Atlas)
mongod --dbpath /data/db

# 5. Start the dev server (hot-reload via nodemon)
npm run dev
```

The API will be available at `http://localhost:5000`.  
Swagger UI docs: `http://localhost:5000/api-docs`

---

## Local Setup (with Docker Compose)

```bash
cp .env.example .env
# Fill in JWT_SECRET and SMTP_* values in .env

docker compose up --build
```

This spins up both the Node.js API and a MongoDB 7 instance with persistent volume storage.

---

## Running Tests

```bash
npm test
```

Tests use **Vitest** with in-memory mocked Mongoose models — no database connection required.

---

## Project Structure

```
src/
├── app.js               # Express app configuration
├── server.js            # HTTP server entrypoint
├── config/              # Environment config loader
├── models/              # Mongoose schemas
├── repositories/        # Data access layer (CRUD wrappers)
├── services/            # Business logic
├── controllers/         # Request/response handlers
├── routes/              # Express routers
├── middlewares/         # Auth, error, rate limit, request ID
├── calculators/         # Emissions calculation engine
├── validators/          # Zod validation schemas
├── errors/              # Custom error classes
├── docs/                # Swagger/OpenAPI spec
└── tests/               # Vitest integration tests
```

---

## Code Style

- **ES Modules** (`import`/`export`) throughout — no CommonJS.
- **Named exports** preferred over default exports (both provided for flexibility).
- **Zod** for all request validation — never trust raw `req.body`.
- Errors must extend `AppError` from `src/errors/customErrors.js`.
- Keep controllers thin: validate → call service → return response.

---

## Pull Request Guidelines

1. Branch from `main`: `git checkout -b feat/my-feature`
2. Run `npm test` and ensure all tests pass before opening a PR.
3. Write or update integration tests for any new endpoints.
4. Keep PRs focused — one feature or fix per PR.
