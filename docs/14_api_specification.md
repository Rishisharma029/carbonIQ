# CarbonIQ API Specification & Integration Architecture (v1)

## Purpose

Define a consistent, versioned, secure API contract that connects the frontend, backend, calculation engine, and future clients while remaining easy to evolve.

---

## Design Principles

- **RESTful Resource Design**: Model endpoints around nouns and collections, utilizing standard HTTP verbs.
- **Stateless Requests**: Ensure each request contains all authentication context, avoiding server-side UI session tracking.
- **Versioned APIs**: Version contracts in the URL path (`/api/v1`) to allow future evolutions without breaking existing clients.
- **Predictable Responses**: Standardize the JSON envelopes for success and error payloads.
- **Consistent Error Handling**: Map exceptions to clear HTTP status codes and provide a uniform error payload containing codes and details.
- **Secure by Default**: Never expose tokens to client-side scripts; validate all bounds with schema validators.
- **OpenAPI-First**: Document all routes, query parameters, headers, and schemas within an OpenAPI configuration.

---

## Base URL

`/api/v1`

*Future major versions will occupy `/api/v2`, etc. Never introduce breaking schema modifications within the same major version.*

---

## Resource Structure

Group routes strictly by business domain:
- `/api/v1/auth`: Registration, logins, logouts, refresh cycles, session management.
- `/api/v1/users`: Admin list and user management.
- `/api/v1/profile`: Authenticated user settings and theme controls.
- `/api/v1/calculations`: Single and bulk footprint logging.
- `/api/v1/dashboard`: Metric aggregation and monthly summaries.
- `/api/v1/history`: Log pagination, filtering, and deletion.
- `/api/v1/goals`: Carbon reduction target records.
- `/api/v1/recommendations`: Actionable reduction suggestions.
- `/api/v1/reports`: PDF and CSV export routes (async BullMQ triggers).
- `/api/v1/health`: Liveness and readiness endpoints.

---

## HTTP Verb Usage

| Method | Operation | Status Codes | Description |
|---|---|---|---|
| **GET** | Read resource(s) | `200 OK`, `404 Not Found` | Safe and idempotent. |
| **POST** | Create resource / calculate | `201 Created`, `200 OK`, `400 Bad Request` | Non-idempotent by default unless sent with `Idempotency-Key`. |
| **PUT** | Full resource update | `200 OK`, `404 Not Found` | Idempotent replacement of the entity. |
| **PATCH** | Partial resource update | `200 OK`, `404 Not Found` | Update specific fields. |
| **DELETE** | Remove resource | `200 OK`, `404 Not Found` | Idempotent removal/soft-delete. |

---

## Headers

- `Content-Type`: `application/json` (for all bodies)
- `Accept`: `application/json`
- `X-Request-ID`: Client or gateway-assigned tracing ID (propagated in all logs and error responses).
- `Idempotency-Key`: UUID string for safeguarding write operations.

---

## Standard Envelopes

### Success Payload
```json
{
  "success": true,
  "message": "Resource created successfully.",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Calculation Alpha"
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "requestId": "req_84c8a2b5b312"
}
```

### Error Payload
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid calculation inputs provided.",
    "details": [
      {
        "field": "transport.carDistance",
        "issue": "Expected number, received string"
      }
    ]
  },
  "requestId": "req_84c8a2b5b312"
}
```
*Stack traces are never exposed in production.*

---

## Pagination, Filtering & Sorting

### Pagination
Core log endpoints must support query parameters:
- `page`: Integer $\ge 1$ (default: `1`)
- `limit`: Integer between $1$ and $100$ (default: `10`)

### Filtering
Allowed fields are whitelisted at the validator schema level.
- E.g. `/api/v1/history?category=transport&startDate=2026-07-01`

### Sorting
Support sorting by field name. Prefix with `-` for descending direction:
- E.g. `?sort=-createdAt` or `?sortBy=createdAt&sortOrder=desc`

---

## Idempotency Protocol

To prevent duplicate transactions on network failure:
1. Client generates a unique UUID `Idempotency-Key` header for POST writes.
2. The server checks the idempotency store (Redis) for the key:
   - **Found**: Returns the cached response body and status code immediately.
   - **Not Found**: Acquires a lock, executes the request, stores the status and response, then releases the lock.
3. Cache records expire after 24 hours.

---

## Observability & Rate Limiting

- Every API response returns rate limit metadata headers:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`
- Every request lifecycle measures duration and appends `requestId` to all logs.
