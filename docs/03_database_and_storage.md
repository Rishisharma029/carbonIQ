# CarbonIQ Database & Storage Architecture (v2)

## Purpose

Design a scalable, production-oriented data layer that preserves
historical accuracy, supports efficient analytics, and evolves safely
over time.

------------------------------------------------------------------------

# Design Principles

-   Domain-driven collection design
-   Immutable historical calculations
-   Versioned schemas
-   Versioned emission factors
-   Atomic writes
-   Optimized reads
-   Security by default
-   Clear separation of operational, derived, and binary storage

------------------------------------------------------------------------

# Technology

-   MongoDB Atlas
-   Mongoose
-   Redis (future)
-   Object Storage (future for reports/assets)

------------------------------------------------------------------------

# Collections

-   users
-   calculations
-   monthlySummaries
-   goals
-   reports
-   emissionFactors
-   refreshTokens
-   auditLogs
-   notificationPreferences
-   systemSettings

------------------------------------------------------------------------

# Entity Relationships

User ├── Calculations ├── Goals ├── Reports ├── Refresh Tokens └──
Notification Preferences

Emission Factors are shared globally.

------------------------------------------------------------------------

# Users

Fields

-   \_id
-   email
-   passwordHash
-   fullName
-   role
-   theme
-   preferredUnit
-   country
-   timezone
-   emailVerified
-   createdAt
-   updatedAt
-   deletedAt

Rules

-   Never store calculation data.
-   Soft delete supported.
-   Email uniqueness enforced only for active users.

## Partial Unique Index

Create a partial unique index on email where deletedAt is null so
deleted accounts do not block future registrations.

------------------------------------------------------------------------

# Calculations

Each document represents one completed assessment.

Fields

-   \_id
-   userId
-   transport
-   electricity
-   food
-   waste
-   results
-   score
-   factorVersion
-   schemaVersion
-   createdByVersion
-   createdAt
-   deletedAt

Rules

-   Immutable after creation.
-   Never edit historical calculations.
-   Create a new calculation if corrections are needed.

------------------------------------------------------------------------

# Results Object

Store calculated output:

-   totalEmission
-   transportEmission
-   electricityEmission
-   foodEmission
-   wasteEmission
-   recommendationSummary

Purpose

Avoid recalculation when rendering reports.

------------------------------------------------------------------------

# Emission Factors

Fields

-   category
-   subcategory
-   country
-   region
-   source
-   version
-   value
-   unit
-   effectiveFrom
-   effectiveTo

Rules

-   Never hardcode values in services.
-   Every calculation stores the factor version used.
-   Historical calculations remain reproducible.

------------------------------------------------------------------------

# Monthly Summaries

Purpose

Materialized view for dashboard performance.

Fields

-   userId
-   month
-   year
-   totalEmission
-   transport
-   electricity
-   food
-   waste
-   averageScore
-   calculationCount
-   updatedAt

Update Strategy

Use:

-   \$inc
-   \$set
-   \$setOnInsert
-   upsert=true

Never read-modify-write in application code.

------------------------------------------------------------------------

# Goals

Fields

-   userId
-   title
-   targetReduction
-   baselineEmission
-   currentEmission
-   progress
-   status
-   startDate
-   endDate

------------------------------------------------------------------------

# Reports

Fields

-   userId
-   type
-   period
-   storagePath
-   generatedAt
-   expiresAt

Only metadata is stored. Generated files belong in object storage.

------------------------------------------------------------------------

# Refresh Tokens

Store:

-   userId
-   tokenHash
-   expiresAt
-   device
-   ipAddress
-   userAgent

Never store raw refresh tokens.

------------------------------------------------------------------------

# Audit Logs

Fields

-   userId
-   action
-   resource
-   metadata
-   ipAddress
-   requestId
-   calculationId
-   timestamp

TTL Index

Automatically expire after configurable retention (e.g. 90 days).

------------------------------------------------------------------------

# Notification Preferences

-   weeklySummary
-   goalReminder
-   reportReady
-   emailEnabled

------------------------------------------------------------------------

# Storage Strategy

Operational Data - Users - Calculations - Goals

Derived Data - Monthly Summaries - Future yearly summaries

Binary Storage - PDF reports - CSV exports - Profile images (future)

Database stores only metadata and object paths.

------------------------------------------------------------------------

# Transactions

Wrap these in one Mongoose session:

1.  Save calculation
2.  Update monthly summary
3.  Update goals
4.  Create audit log

Commit only if every step succeeds.

Rollback otherwise.

------------------------------------------------------------------------

# Index Catalog

Users - Partial unique email

Calculations - (userId, createdAt DESC) - (userId, factorVersion) -
(userId, deletedAt)

MonthlySummaries - Unique (userId, year, month)

Goals - (userId, status)

Reports - (userId, generatedAt DESC)

RefreshTokens - tokenHash

AuditLogs - (userId, timestamp) - TTL on timestamp

------------------------------------------------------------------------

# Soft Deletes

Use deletedAt.

Never permanently delete immediately.

------------------------------------------------------------------------

# Schema Versioning

Every calculation stores

-   schemaVersion
-   createdByVersion

Migration scripts should upgrade old schemas instead of editing
manually.

------------------------------------------------------------------------

# Concurrency

Monthly summary updates must use MongoDB atomic operators.

Never:

Read -\> Modify -\> Save

Always:

findOneAndUpdate + $inc
+$setOnInsert + upsert

------------------------------------------------------------------------

# Data Integrity

Immutable

-   results
-   score
-   factorVersion
-   createdAt

Mutable

-   theme
-   preferences
-   goal status

------------------------------------------------------------------------

# Validation

Validation occurs at two levels

1.  Zod
2.  MongoDB JSON Schema validation (critical collections)

------------------------------------------------------------------------

# Time Standard

Store UTC only.

Convert to local time on frontend.

------------------------------------------------------------------------

# Backup

-   Atlas backups
-   Restore procedure documented
-   Point-in-time recovery when available

------------------------------------------------------------------------

# Data Retention

Refresh Tokens - TTL expiry

Password Reset Tokens - TTL expiry

Email Verification Tokens - TTL expiry

Audit Logs - TTL expiry

Calculations - Retained unless user requests deletion

------------------------------------------------------------------------

# Future Scalability

Prepared for

-   Water usage
-   Business travel
-   Renewable energy
-   Team accounts
-   Organization accounts
-   Redis cache
-   Queue workers

Consider ownerId + ownerType for future multi-tenant support.

------------------------------------------------------------------------

# Database Principles

-   Prefer immutable history.
-   Optimize reads without sacrificing correctness.
-   Use atomic database operations.
-   Version schemas and emission factors.
-   Document every index and its purpose.
-   Separate operational, derived, and binary storage.
-   Keep historical reports reproducible.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-07-15T23:37:21+05:30.
</ADDITIONAL_METADATA>