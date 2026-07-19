# CarbonIQ Authentication & Authorization Architecture (v1)

## Purpose

Design a secure, scalable authentication and authorization system that
separates identity management from access control while following modern
backend security practices.

------------------------------------------------------------------------

# Core Principles

-   Authentication and authorization are separate concerns.
-   Use secure defaults.
-   Never expose tokens to JavaScript.
-   Keep sessions manageable across multiple devices.
-   Apply least-privilege access.
-   Every sensitive action is auditable.

------------------------------------------------------------------------

# Technology Stack

-   JWT (Access Token)
-   Refresh Tokens
-   HTTP-only Secure Cookies
-   bcrypt
-   Zod
-   Helmet
-   Cookie Parser
-   CSRF Protection
-   express-rate-limit
-   Nodemailer

------------------------------------------------------------------------

# Module Structure

``` text
identity/
├── registration/
├── login/
├── sessions/
├── password/
└── verification/

access/
├── roles/
├── permissions/
├── ownership/
└── authorization/
```

------------------------------------------------------------------------

# Backend Folder Structure

``` text
src/
├── controllers/
│   └── auth/
├── services/
│   ├── identity/
│   └── access/
├── repositories/
├── routes/
├── middlewares/
│   ├── authenticate.js
│   ├── authorize.js
│   ├── csrf.js
│   └── rateLimit.js
├── utils/
├── validators/
└── models/
```

------------------------------------------------------------------------

# Authentication Flow

User → Validate credentials → Generate Access Token → Generate Refresh
Token → Hash refresh token → Store session → Send HTTP-only cookies

Frontend never stores JWTs.

------------------------------------------------------------------------

# Token Strategy

## Access Token

Purpose: - Authenticate API requests

Lifetime: - 10--15 minutes

Payload: - userId - role - sessionId - tokenVersion - issuedAt -
expiresAt

Keep payload minimal.

------------------------------------------------------------------------

## Refresh Token

Purpose: - Issue new access tokens

Lifetime: - 30 days

Rules: - Store in HTTP-only Secure Cookie - Store only hash in
database - Rotate on every refresh

Never store plaintext refresh tokens.

------------------------------------------------------------------------

# Session Management

Support multiple concurrent sessions.

Example devices: - Laptop - Phone - Tablet

Features: - Logout current session - Logout all sessions - View active
sessions

------------------------------------------------------------------------

# Session Collection

Fields

-   sessionId
-   userId
-   refreshTokenHash
-   device
-   browser
-   operatingSystem
-   ipAddress
-   createdAt
-   lastUsedAt
-   expiresAt
-   revokedAt

------------------------------------------------------------------------

# Authorization

## Roles

-   USER
-   ADMIN

## Permissions

-   calculation:create
-   calculation:read
-   calculation:delete
-   goal:create
-   goal:update
-   report:generate
-   admin:user:list
-   admin:user:update

Roles map to permissions.

Never hardcode role checks throughout controllers.

------------------------------------------------------------------------

# Middleware Pipeline

Request → Rate Limiter → Cookie Parser → CSRF → Authentication →
Authorization → Validation → Controller

Each middleware performs one responsibility.

------------------------------------------------------------------------

# Ownership Checks

Always verify resource ownership.

Example:

history.userId == authenticatedUser.id

Never trust IDs from the client.

------------------------------------------------------------------------

# Registration Flow

Register → Create unverified user → Generate verification token → Send
email → Verify email → Enable full account access

------------------------------------------------------------------------

# Login Flow

Login → Validate credentials → Check verification → Create session →
Generate tokens → Send cookies → Audit log

------------------------------------------------------------------------

# Refresh Flow

Validate refresh token → Verify session → Rotate refresh token → Issue
new access token → Update cookies

------------------------------------------------------------------------

# Logout

Current Session - Revoke current refresh token

Logout All - Revoke every active session - Increment tokenVersion

------------------------------------------------------------------------

# Password Reset

Forgot Password → Generate reset token → Email user → Reset password →
Invalidate all sessions → Require login again

------------------------------------------------------------------------

# Email Verification

Verification token - Single use - Short expiry - Removed after
successful verification

------------------------------------------------------------------------

# Password Policy

Minimum requirements: - 12 characters - Uppercase - Lowercase - Number -
Special character

Reject common passwords.

------------------------------------------------------------------------

# Security Features

-   HTTP-only cookies
-   Secure cookies
-   SameSite policy
-   CSRF protection
-   Helmet
-   bcrypt hashing
-   Session rotation
-   Token versioning
-   Origin validation

------------------------------------------------------------------------

# Rate Limiting

Global - 100 requests / 15 minutes

Login - 5 attempts / 15 minutes

Forgot Password - 3 requests / hour

Password Reset - Limited

Report Generation - 5 requests / hour

------------------------------------------------------------------------

# Account Protection

-   Temporary lock after repeated failed logins
-   Audit failed attempts
-   Generic login error messages

Example:

"Invalid email or password."

------------------------------------------------------------------------

# Audit Events

Track:

-   Register
-   Login
-   Failed Login
-   Logout
-   Logout All
-   Password Change
-   Password Reset
-   Email Verification
-   Session Revoked
-   Role Change

------------------------------------------------------------------------

# Token Versioning

User document stores:

-   tokenVersion

Increment when:

-   Password changes
-   Logout all
-   Account disabled

Old tokens become invalid.

------------------------------------------------------------------------

# OAuth Ready

Future fields:

-   provider
-   providerId

Supports: - Google - GitHub - Microsoft

------------------------------------------------------------------------

# API Endpoints

POST /auth/register POST /auth/login POST /auth/logout POST
/auth/logout-all POST /auth/refresh POST /auth/forgot-password POST
/auth/reset-password POST /auth/verify-email GET /auth/me GET
/auth/sessions DELETE /auth/sessions/:id

------------------------------------------------------------------------

# Testing Strategy

-   Unit tests
-   Token tests
-   Session tests
-   Permission tests
-   Integration tests
-   CSRF tests
-   Ownership tests

------------------------------------------------------------------------

# Engineering Standards

-   Thin controllers
-   Service-first architecture
-   Permission-based authorization
-   Secure cookie authentication
-   Hash refresh tokens
-   Rotate refresh tokens
-   Never trust client ownership
-   Audit sensitive actions
-   Generic authentication errors
-   Principle of least privilege

</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-07-15T23:51:51+05:30.
</ADDITIONAL_METADATA>