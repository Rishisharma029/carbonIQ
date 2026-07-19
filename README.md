# 🌐 CarbonIQ — Enterprise Carbon Footprint Tracker & Analytics

CarbonIQ is a production-grade, full-stack carbon accounting and analytics platform designed for modular, explainable footprint calculations. Built with localized emission factor registries (such as Indian CEA, ARAI, and PPAC baselines), the system features an interactive analytics dashboard, target-driven goal tracking, multi-device session security, and downloadable PDF/CSV reports.

---

## 🏗️ System Architecture & Logical Layers

```mermaid
graph TD
    classDef layer fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef component fill:#e1f5fe,stroke:#0288d1,stroke-width:1px;

    subgraph Client ["Presentation Layer (Vite + React SPA)"]
        UI["Tailwind v4 Components"]
        Zustand["Zustand Stores (Auth, Theme)"]
        ReactQuery["TanStack Query (Queries & Mutations)"]
        Axios["Axios (JWT auto-refresh + CSRF interceptors)"]
    end

    subgraph Backend ["Domain & Service Layer (Express REST API)"]
        API["API Gateways & Router"]
        AuthM["Auth & CSRF Middlewares"]
        Controllers["Controllers (MVC Architecture)"]
        CalcService["Calculation Engine Service"]
        IdentityService["Identity & Session Service"]
        Repos["Repository Layer (Mongoose ODM Mapping)"]
    end

    subgraph Storage ["Infrastructure & Database Layer"]
        Atlas["MongoDB Atlas Cluster"]
        Redis["Redis (Rate Limiting & Session Cache)"]
    end

    UI --> Zustand
    UI --> ReactQuery
    ReactQuery --> Axios
    Axios -- "HTTP / Cookies" --> AuthM
    AuthM --> Controllers
    Controllers --> CalcService
    Controllers --> IdentityService
    CalcService --> Repos
    IdentityService --> Repos
    Repos --> Atlas
    AuthM --> Redis
```

---

## 🔒 Security Architecture: Double-Submit CSRF Pattern

To safeguard state-mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) against Cross-Site Request Forgery (CSRF) vulnerabilities, CarbonIQ uses a double-submit cookie validation flow.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend React App
    participant CSRF as CSRF Middleware
    participant Controller as Express Router
    participant ClientCookie as Client Browser Cookie Jar

    Client->>CSRF: GET /api/v1/auth/csrf-token
    Note over CSRF: Generate secure random 32-byte token
    CSRF-->>ClientCookie: Set-Cookie: csrf_token=<token>; SameSite=Strict
    CSRF-->>Client: Response Body: { csrfToken: <token> }
    
    Note over Client: Axios caches token and automatically<br/>attaches it to "x-csrf-token" headers
    
    Client->>CSRF: POST /api/v1/calculator { payload }<br/>Header: x-csrf-token = <token>
    Note over CSRF: Compare request header x-csrf-token<br/>with csrf_token cookie via constant-time timingSafeEqual
    alt CSRF Match Successful
        CSRF->>Controller: Forward request to route handler
        Controller-->>Client: 201 Created (Calculation Logged)
    else Tokens Mismatch or Missing
        CSRF-->>Client: 403 Forbidden (Invalid CSRF Token)
    end
```

---

## 🔑 Session Lifespan & Token Rotation Lifecycle

CarbonIQ handles authentication via short-lived JWT Access Tokens stored in HttpOnly cookies, backed by long-lived Refresh Tokens stored in MongoDB Sessions for multi-device revocation.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client App (Axios Interceptor)
    participant Auth as Authenticate Middleware
    participant Route as Protected Controller
    participant Session as Session & Refresh Service

    Client->>Auth: GET /api/v1/dashboard (access_token cookie)
    Note over Auth: Verify JWT signature and token version
    alt Access Token Valid
        Auth->>Route: Forward Request
        Route-->>Client: 200 OK (Dashboard Data)
    else Access Token Expired (401)
        Auth-->>Client: 401 Unauthorized
        Note over Client: Interceptor intercepts 401, pauses queue,<br/>and triggers silent refresh
        Client->>Session: POST /api/v1/auth/refresh (refresh_token cookie)
        Note over Session: Validate active session and rotate refresh token
        alt Refresh Successful
            Session-->>Client: Set-Cookie: access_token, refresh_token
            Note over Client: Flush queued requests using new session cookies
            Client->>Auth: Retry original request GET /api/v1/dashboard
            Auth->>Route: Forward Request
            Route-->>Client: 200 OK (Dashboard Data)
        else Refresh Token Expired or Revoked
            Session-->>Client: 401 Session Dead
            Note over Client: Clear store state & Redirect to /login
        end
    end
```

---

## 📐 Calculation Engine & Summary Aggregation Pipeline

```mermaid
flowchart TD
    A[Client Submit Calculation Inputs] --> B[Zod Validation: calculatorSchema]
    B --> C[Resolve State & Version Parameters]
    C --> D[Retrieve Emission Factors from FactorRepository]
    D --> E[Fallback to National Baseline if State-Specific Missing]
    E --> F[Run Category Calculations: Transport, Electricity, Food, Waste, Water, Gas]
    F --> G[Aggregate Total Carbon Emission Metric tons CO2e/yr]
    G --> H[Compute Sustainability Score 0-100]
    H --> I[MongoDB Transaction Start]
    I --> J[Save Calculation Entry]
    J --> K[summaryRepository.incrementSummary: Update Monthly Aggregates]
    K --> L[goalService.syncGoalsOnCalculation: Adjust Active Goals Progress]
    L --> M[Commit Transaction]
    M --> N[Return Calculation Result DTO to Client]
```

---

## 🚀 Quick Start (Local Development)

### Workspace Directory Layout
- `/frontend`: React SPA built with Vite, Tailwind CSS v4, Zustand, and TanStack Query.
- `/backend`: Node/Express REST API utilizing MongoDB Atlas, Pino logging, and secure HTTP-only cookies.
- `/docs`: Detailed system architecture blueprints.

### 1. Backend API Configuration
1. Navigate to `/backend`.
2. Configure `.env` based on `.env.example`:
   ```ini
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=supersecretjwtkeythatisextremelysecure
   ```
3. Install dependencies and start server:
   ```bash
   npm install
   npm run dev
   ```
4. Run integration tests:
   ```bash
   npm test
   ```

### 2. Frontend Configuration
1. Navigate to `/frontend`.
2. Install dependencies and launch Vite development server:
   ```bash
   npm install
   npm run dev
   ```
3. Visit `http://localhost:5173`. Navigate to `/design-system` to preview the interactive UI variables and components showcase.

---

## 📃 License

This project is licensed under the MIT License - see the [LICENSE](file:///c:/Users/Rishi%20Sharma/OneDrive/Desktop/PRODUCTION/carbonIQ/LICENSE) file for details.
