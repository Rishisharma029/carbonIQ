# CarbonIQ High-Level Design (HLD) Architecture

## Purpose

Provide a complete architectural overview of CarbonIQ from a business, technical and operational perspective. This document serves as the primary system blueprint before implementation.

---

## Objectives

- Present the overall system architecture.
- Describe major components and their responsibilities.
- Explain system interactions.
- Demonstrate scalability, security and maintainability.
- Act as the architectural reference for development.

---

## Executive Summary

CarbonIQ is a full-stack web application for calculating, tracking and improving users' carbon footprints. The platform combines a React frontend, Express.js backend, MongoDB Atlas, Redis, BullMQ workers and a modular calculation engine to deliver explainable and scalable carbon analytics.

---

## Functional Scope

### Core Modules
- Authentication & Sessions
- User Profile & Settings
- Carbon Calculator (Inputs, Normalization, Conversion)
- Dashboard (Analytics, Aggregations, Metrics)
- Goals (Reduction Targets, Progress Tracking)
- Recommendations (Tailored Actionable Items)
- Reports (PDF/CSV Exports, BullMQ async jobs)
- History (Paginated Log Retrieval, Soft-Deletes)
- Administration (User Management, Audit Logs)

---

## Non-Functional Goals

- **Scalability**: Horizontal scalability for stateless REST APIs and background workers.
- **Security**: Strict boundaries (HTTPS, HTTP-only cookies, CSRF protection, RBAC, ownership checks, rate limiting).
- **Availability**: High availability via readiness/liveness checks, retries with backoff, and DLQs.
- **Reliability**: Graceful degradation, transaction checks, and audit logging.
- **Performance**: Sub-100ms response times for core API routes, fast SPA loading.
- **Observability**: Structured JSON logging, Request-IDs, and correlation.
- **Extensibility**: Modular calculation engine, dependency injection.
- **Maintainability & Testability**: Clear separation of concerns, high unit and integration test coverage.

---

## System Context

```
+-------------+      HTTPS      +-------------+      Mongoose      +---------------+
|    React    | --------------> | Express API | -----------------> | MongoDB Atlas |
|  Frontend   |                 +-------------+                    +---------------+
+-------------+                        |
                                       | Cache / Queue
                                       v
                                +-------------+                    +---------------+
                                |    Redis    | -----------------> |    BullMQ     |
                                |  (Caching)  |                    |    Workers    |
                                +-------------+                    +---------------+
                                                                           |
                                                                           v
                                                                   +---------------+
                                                                   |  PDF Reports  |
                                                                   |    Storage    |
                                                                   +---------------+
```

---

## Logical Architecture

```
+-------------------------------------------------------------+
|                     Presentation Layer                      |
|            (React, Vite, Zustand, Router, Query)            |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                          API Layer                          |
|                 (Express REST Controllers)                  |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                      Application Layer                      |
|            (Services, Validation, Business Rules)           |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                        Domain Layer                         |
|            (Calculator, Recommendation, Score Engine)       |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                     Data Access Layer                       |
|                 (Repositories, Mongoose Models)             |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                    Infrastructure Layer                     |
|           (MongoDB Atlas, Redis, BullMQ, Pino Logs)         |
+-------------------------------------------------------------+
```
*Dependencies flow downward only.*

---

## Data Flow

### Registration
`Client -> API -> Validation (Zod) -> Database (User save) -> Response`

### Calculation
`Client -> Validation -> Normalization -> Factor Resolver -> Category Calculators -> Aggregator -> Score Engine -> Recommendation Engine -> Persistence (Calculations & Summaries) -> Response`

### Report
`Client -> API -> BullMQ -> Worker -> PDF -> Storage -> Download`

---

## Security Boundaries

- HTTPS everywhere.
- Tokens stored in HTTP-only, Secure, SameSite=Strict cookies.
- CSRF protection via double-submit cookie pattern.
- Role-Based Access Control (RBAC) middleware.
- Strict resource ownership validation at service layers.
- Multiple rate-limiting tiers (global, login, forgot-password, reports).
- Structured logging with Request-IDs to trace malicious payloads.

---

## Data Architecture

MongoDB is the system of record. Core collections include:
- `users`: Credentials, settings, locked status, provider info, and tokenVersion.
- `calculations`: Raw inputs, normalized results, scores, explainability logs.
- `goals`: Targets, starting points, target dates, progress trackers.
- `reports`: Async jobs metadata, format, download URLs.
- `auditLogs`: Immutable security and transactional events (IP, user agent, requestId).
- `monthlySummaries`: Aggregated metrics per user per month.
- `emissionFactors`: Vetted conversion values indexed by region and activity.

---

## Caching Strategy

- **Browser Cache**: Static assets, bundles, icons.
- **CDN**: Cacheable public assets.
- **Redis Cache**: Cached emission factors, user session states, and dashboard summaries.
- **Cache-Aside Pattern**: Read from cache -> fallback to Database -> populate cache. Explicit invalidation upon write.

---

## Technology Decisions

| Layer | Technology | Reason |
|---|---|---|
| **Frontend** | React + Vite | Fast single-page application bundling, optimized dev server. |
| **Backend** | Express.js | Lightweight REST API framework, easily extensible middleware chain. |
| **Database** | MongoDB Atlas | Flexible document model for evolving input structures. |
| **Cache & Queue** | Redis + BullMQ | Shared caching layer and background job workers for heavy PDF generation. |
| **Validation** | Zod | Schema-first, type-safe validation for all boundaries. |
| **State** | Zustand + TanStack Query | Client state & asynchronous server state synchronization. |
| **Auth** | JWT + Cookies | Secure session handling, stateless API validation. |

---

## Future Roadmap

### Version 1
- Core calculator
- Monthly summaries dashboard
- PDF/CSV report exports

### Version 2
- Redis caching layer
- BullMQ worker autoscaling
- AI-driven personalized reduction recommendations

### Version 3
- Multi-region deployment
- Team workspaces & organization scopes
- Public developer APIs

---

## Related Architecture Documents

01. Frontend Architecture
02. Backend Architecture
03. Database & Storage Architecture
04. Authentication & Authorization Architecture
05. Cloud & Compute
06. CI/CD & Version Control
07. Security & RLS
08. Rate Limiting & Abuse Prevention
09. Caching & CDN
10. Load Balancing & Scaling
11. Logging & Observability
12. Availability & Recovery
13. Calculation Engine
14. API Specification

*This HLD is the entry point to the complete architecture set.*
