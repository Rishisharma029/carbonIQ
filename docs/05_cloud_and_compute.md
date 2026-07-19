# CarbonIQ Cloud & Compute Architecture (v2)

## Purpose

Design a cloud-native, production-ready infrastructure that is scalable, secure, observable, cost-efficient, and easy to deploy while remaining practical for deployment.

---

## Design Principles

- **Stateless Backend**: The API layers do not persist user, session, or calculation state in memory; all state is managed in the database or cache.
- **Horizontal Scalability**: Add or remove stateless compute nodes dynamically to handle load changes.
- **Secure by Default**: Enforce TLS/HTTPS everywhere, keep credentials out of code repositories, and lock down boundary policies.
- **Vendor-Neutral Architecture**: Avoid tight coupling to any single cloud provider's proprietary APIs.
- **Infrastructure as an Enabler**: The application remains runnable locally in standard containers without cloud dependencies.

---

## Environment Separation

CarbonIQ maintains three isolated environments:
- **Development**: Local environment with quick reload and verbose logging.
- **Staging**: Sandbox replicating production configuration to verify releases.
- **Production**: Main user-facing tier utilizing full security, caching, and database connection settings.

*Every environment must utilize distinct secrets, database clusters, and origins.*

---

## Startup Environment Validation

The application must validate that all mandatory environment variables are present and syntactically correct on startup. If validation fails, the process must terminate immediately with exit code `1`:
- `MONGO_URI`
- `JWT_SECRET`
- `ALLOWED_ORIGINS`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (if mailing features are enabled)

---

## Graceful Shutdown Sequence

Stateless compute containers must capture `SIGTERM` and `SIGINT` signals to prevent dropping active requests:
1. **Stop Accepting Connections**: Instruct the Express HTTP server to stop listening for new requests.
2. **Complete In-Flight Work**: Allow up to 15 seconds for active requests to finish execution.
3. **Release Infrastructure Pools**: Close the shared MongoDB connection pool and release any active Redis clients.
4. **Flush Buffers**: Ensure any buffered logs (Pino) are fully flushed.
5. **Exit Process**: Call `process.exit(0)`.

---

## Database Connection Pooling

The backend uses a single, shared connection pool managed by Mongoose. Recommended configuration parameters:
- `maxPoolSize`: `50` (or size adapted to instance capacity)
- `minPoolSize`: `10`
- `maxIdleTimeMS`: `30000` (30 seconds)
- `serverSelectionTimeoutMS`: `5000` (5 seconds)

*Never instantiate a new connection pool per request.*

---

## Background Processing (Queue Model)

Compute-heavy or slow tasks must be run asynchronously outside the request-response cycle:
```
+-------------+   Enqueues Job   +-------------+   Pulls Job   +-------------+
| Express API | ---------------> | Redis Queue | ------------> |   BullMQ    |
|  Container  |                  |  (BullMQ)   |               |   Worker    |
+-------------+                  +-------------+               +-------------+
                                                                      |
                                                                      v
                                                               +-------------+
                                                               | Write files |
                                                               | to Storage  |
                                                               +-------------+
```

---

## Health Indicators

The API exposing monitoring endpoints must return appropriate states:
- **Liveness (`/live`)**: Confirms the node process is running and hasn't entered a deadlock state.
- **Readiness (`/ready`)**: Verifies active connectivity to MongoDB Atlas, Redis, and queues. Returns `503 Service Unavailable` on failure.
- **Health (`/health`)**: Full system diagnostic payload (uptime, process memory usage, database query latency, app version).

---

## Engineering Standards

- Maintain stateless, independent compute clusters.
- Configure explicit CORS white-listing using regex/exact-matches loaded from `ALLOWED_ORIGINS`.
- Log strictly using structured JSON (Pino) for production ingest.
- Enforce memory and execution limits on endpoints to avoid resource exhaustion.
- Require automated test verification (CI/CD) before staging/production deployment.
