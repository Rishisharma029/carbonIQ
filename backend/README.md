# CarbonIQ Backend API

A production-ready REST API for tracking personal carbon footprints, setting reduction goals, exporting reports, and getting actionable recommendations.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22 LTS |
| Framework | Express.js 4 |
| Database | MongoDB Atlas + Mongoose 8 |
| Auth | JWT (HTTP-only cookies) + bcryptjs |
| Validation | Zod |
| Security | Helmet, CORS, express-rate-limit |
| Logging | Pino + Morgan |
| Reports | PDFKit + csv-writer |
| Docs | Swagger UI (OpenAPI 3.1) |
| Tests | Vitest + Supertest |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health` | Service health check |
| `POST` | `/api/v1/auth/register` | Register new user |
| `POST` | `/api/v1/auth/login` | Login and set cookie |
| `POST` | `/api/v1/auth/logout` | Clear auth cookie |
| `GET` | `/api/v1/users/me` | Get current user |
| `PUT` | `/api/v1/users/profile` | Update name/email |
| `PUT` | `/api/v1/users/settings` | Update theme/unitSystem |
| `POST` | `/api/v1/calculator` | Submit emissions calculation |
| `GET` | `/api/v1/dashboard` | Get metrics & monthly summaries |
| `GET` | `/api/v1/history` | Paginated calculation history |
| `DELETE` | `/api/v1/history/:id` | Soft-delete calculation entry |
| `GET` | `/api/v1/goals` | Get reduction goals |
| `POST` | `/api/v1/goals` | Create reduction goal |
| `GET` | `/api/v1/reports/pdf` | Download PDF report (5/hr) |
| `GET` | `/api/v1/reports/csv` | Download CSV export |
| `GET` | `/api/v1/recommendations` | Get recommendations catalog |
| `POST` | `/api/v1/recommendations/toggle` | Toggle recommendation |

Full interactive docs: **`/api-docs`** (Swagger UI)

---

## Quick Start

```bash
cp .env.example .env
# Fill in your MONGO_URI, JWT_SECRET, and SMTP_* values

npm install
npm run dev
```

Or with Docker:

```bash
docker compose up --build
```

---

## Running Tests

```bash
npm test
```

16 integration tests across 6 test suites — no database required (Mongoose fully mocked).

---

## Environment Variables

See [`.env.example`](.env.example) for all required and optional variables.

---

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for setup instructions and code style guidelines.

---

## License

MIT
