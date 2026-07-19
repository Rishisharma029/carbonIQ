# CarbonIQ Backend Architecture & API Logic (v2)

## Purpose

Build a production-ready backend that validates requests, calculates
emissions using versioned factors, stores results safely, and exposes
secure REST APIs.

## Tech Stack

-   Node.js (LTS)
-   Express.js
-   MongoDB Atlas
-   Mongoose
-   JWT (HTTP-only cookies)
-   bcrypt
-   Zod
-   Helmet
-   CORS
-   Compression
-   Pino
-   Morgan (development)
-   express-rate-limit
-   Nodemailer
-   PDFKit
-   csv-writer
-   Swagger/OpenAPI

## Folder Structure

``` text
backend/
└── src/
    ├── app/
    ├── config/
    ├── controllers/
    ├── services/
    ├── repositories/
    ├── calculators/
    ├── recommendations/
    ├── models/
    ├── routes/
    ├── middlewares/
    ├── validators/
    ├── schemas/
    ├── utils/
    ├── constants/
    ├── errors/
    ├── jobs/
    ├── docs/
    ├── tests/
    ├── app.js
    └── server.js
```

## Request Flow

Client → Route → Validation → Controller → Service/Calculation Engine →
Repository → MongoDB

## Layer Responsibilities

Controllers: - Parse request - Call service - Return response

Services: - Business logic - Calculation orchestration - Reports -
Recommendations - Goal updates

Repositories: - Database operations only - Return normalized objects

## Route Groups

-   /api/v1/auth
-   /api/v1/users
-   /api/v1/calculator
-   /api/v1/dashboard
-   /api/v1/history
-   /api/v1/reports
-   /api/v1/goals
-   /api/v1/recommendations
-   /api/v1/health

## Authentication

Use HTTP-only Secure cookies only. Never store JWTs in
localStorage/sessionStorage.

## Calculation Engine

-   TransportCalculator
-   ElectricityCalculator
-   FoodCalculator
-   WasteCalculator
-   ScoreCalculator
-   RecommendationEngine
-   ReportAggregator

## API Principles

-   Thin controllers
-   Standard response format
-   Versioned APIs
-   Idempotency-Key support
-   Pagination
-   Sorting
-   Filtering

## History API

Supports: - page - limit - sort - category - date range

## Database Collections

-   users
-   calculations
-   goals
-   reports
-   emissionFactors
-   refreshTokens
-   monthlySummaries
-   auditLogs

## Transactions

Wrap: - Save calculation - Update goals - Update monthly summary - Audit
log

Rollback if any step fails.

## Emission Factors

Store: - category - region - source - version - unit - value

Persist factor version with every calculation.

## Error Handling

Custom errors: - ValidationError - AuthenticationError -
AuthorizationError - NotFoundError - CalculationError

Global error middleware only.

## Logging

Development: - Morgan

Production: - Pino

Include request IDs.

## Rate Limiting

Global: 100/15min Login: 5/15min Forgot Password: 3/hour Calculator:
60/hour PDF Export: 5/hour

## Soft Deletes

Use deletedAt timestamp.

## Audit Trail

Track: - Login - Password changes - Calculations - Goal updates - Report
exports

## Time

Store UTC only.

## Environment Validation

Fail startup if: - Mongo URI missing - JWT secret missing - SMTP config
missing

## Documentation

Generate OpenAPI 3.1 and Swagger UI.

## Testing

-   Unit
-   Repository
-   Integration
-   API

## Roadmap

Sprint 1: Setup Sprint 2: Auth Sprint 3: Calculation Engine Sprint 4:
Dashboard & History Sprint 5: Reports & Goals Sprint 6: Testing &
Deployment

## Code Standards

-   Thin controllers
-   Service-first
-   Repository pattern
-   No business logic in routes
-   Comment decisions, not syntax
-   Secure defaults
-   Versioned emission factors
-   Consistent API responses

</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-07-15T23:18:31+05:30.
</ADDITIONAL_METADATA>