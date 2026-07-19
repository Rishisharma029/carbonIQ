# CarbonIQ Frontend Architecture & Development Plan

## Purpose

CarbonIQ is a production-quality carbon footprint tracking application.
The frontend should prioritize clarity, maintainability, accessibility,
and realistic user workflows over flashy visuals.

------------------------------------------------------------------------

# Core Principles

-   Build features only if they solve a real user problem.
-   Keep the UI clean and consistent.
-   Prefer reusable components over duplication.
-   Document design decisions, not obvious code.
-   Every emission value must have a documented source.
-   Accessibility and responsiveness are first-class requirements.
-   Performance is considered from the start.

------------------------------------------------------------------------

# Tech Stack

-   React 19
-   Vite
-   Tailwind CSS v4
-   React Router v7
-   Zustand (client/UI state)
-   TanStack Query (server state)
-   Axios
-   React Hook Form
-   Zod
-   Recharts
-   Framer Motion
-   Lucide React
-   date-fns
-   ESLint
-   Prettier
-   Husky
-   lint-staged
-   Storybook
-   Vitest
-   React Testing Library

------------------------------------------------------------------------

# State Management

## Zustand

-   Theme
-   Sidebar
-   Authentication token
-   Current calculator step
-   Draft calculator data
-   Modal state
-   Notifications

## TanStack Query

-   Dashboard
-   History
-   Reports
-   Goals
-   Recommendations
-   User profile

------------------------------------------------------------------------

# Folder Structure

``` text
frontend/
└── src/
    ├── app/
    ├── assets/
    ├── shared/
    │   ├── components/
    │   ├── charts/
    │   ├── icons/
    │   └── ui/
    ├── features/
    │   ├── auth/
    │   ├── calculator/
    │   ├── dashboard/
    │   ├── history/
    │   ├── reports/
    │   ├── goals/
    │   └── profile/
    ├── services/
    ├── store/
    ├── schemas/
    ├── hooks/
    ├── constants/
    ├── utils/
    ├── styles/
    └── types/
```

------------------------------------------------------------------------

# Pages

-   Home
-   Login
-   Register
-   Dashboard
-   Calculator
-   History
-   Reports
-   Goals
-   Profile
-   Settings
-   About
-   404

------------------------------------------------------------------------

# Landing Page

Sections: 1. Navbar 2. Hero 3. Trusted Data Sources 4. Features 5.
Calculator Preview 6. Dashboard Preview 7. FAQ 8. Footer

------------------------------------------------------------------------

# Calculator Flow

Transportation → Electricity → Food → Waste → Review → Results

Each step: - Own validation - Own Zod schema - Save draft to Zustand -
Continue to next step

------------------------------------------------------------------------

# Dashboard

-   KPI cards
-   Emission trend
-   Category breakdown
-   Recent history
-   Goals
-   Recommendations

------------------------------------------------------------------------

# Shared Components

-   Button
-   Card
-   Input
-   Select
-   Modal
-   Dialog
-   Table
-   Badge
-   Tooltip
-   Skeleton
-   Spinner
-   EmptyState
-   ErrorState
-   StatCard
-   ChartCard
-   SectionHeader
-   PageHeader

------------------------------------------------------------------------

# API Architecture

Component → TanStack Query → Feature API Service → Axios Client →
Backend

Never call Axios directly from UI components.

------------------------------------------------------------------------

# Validation

One schema per feature:

-   transport.schema
-   electricity.schema
-   food.schema
-   waste.schema
-   calculator.schema

------------------------------------------------------------------------

# Loading States

Every data page includes: - Skeleton UI - Empty state - Error state

No infinite spinners.

------------------------------------------------------------------------

# Error Messages

Provide actionable messages.

Example: "We couldn't load your dashboard. Check your connection and try
again."

------------------------------------------------------------------------

# UI Guidelines

-   Minimal interface
-   Consistent spacing
-   Limited animations
-   Soft shadows
-   Rounded corners
-   Mobile-first
-   Dark / Light / System theme

------------------------------------------------------------------------

# Accessibility

-   Semantic HTML
-   Keyboard navigation
-   Focus indicators
-   ARIA where needed
-   Good color contrast
-   Reduced motion support

------------------------------------------------------------------------

# Performance

-   Route lazy loading
-   Dynamic imports
-   Memoized charts
-   Optimized images
-   Bundle analysis before release

------------------------------------------------------------------------

# Git Workflow

Example commits:

-   chore: initialize project
-   feat: add application shell
-   feat: implement transport step
-   refactor: extract shared numeric input
-   fix: prevent duplicate calculations
-   docs: add architecture overview

------------------------------------------------------------------------

# README Style

Keep it professional: - Problem - Solution - Tech stack - Architecture -
Installation - Data sources - License

Avoid marketing language and unnecessary emojis.

------------------------------------------------------------------------

# Code Standards

-   Explain *why*, not *what*, in comments.
-   Keep components focused.
-   Prefer composition over inheritance.
-   Avoid magic numbers.
-   Keep files reasonably small.
-   No unused dependencies.

------------------------------------------------------------------------

# Development Roadmap

Sprint 1 - Project setup - Routing - Theme - Layout - Design tokens

Sprint 2 - Shared UI library

Sprint 3 - Landing page

Sprint 4 - Calculator

Sprint 5 - Dashboard

Sprint 6 - Authentication

Sprint 7 - Reports, history, deployment, testing

------------------------------------------------------------------------

# Final Quality Checklist

-   Functional
-   Accessible
-   Responsive
-   Tested
-   Documented
-   Performant
-   Consistent
-   Uses sourced emission factors
-   Production-ready

</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-07-15T22:48:47+05:30.
</ADDITIONAL_METADATA>
<USER_SETTINGS_CHANGE>
The user changed setting `Model Selection` from None to Gemini 3.5 Flash (Medium). No need to comment on this change if the user doesn't ask about it. If reporting what model you are, please use a human readable name instead of the exact string.
</USER_SETTINGS_CHANGE>