# CarbonIQ Disaster Recovery Runbooks (v2)

This document contains step-by-step procedures for detecting, mitigating, and recovering from failures in CarbonIQ's infrastructure dependencies.

---

## 1. MongoDB Atlas Outage Runbook

### Symptoms
- API responses fail with `500 Server Error` or hang due to timeouts.
- Readiness check (`/ready`) returns `503 Service Unavailable`.
- Error logs show `MongoNetworkError`, `MongooseServerSelectionError`, or connection timeouts.

### Detection
- **Alerting**: PagerDuty/Opsgenie triggers on `/ready` returning non-200.
- **Monitoring**: Datadog/CloudWatch metrics show database query latency spiking to `null` or `5xx` rates rising.
- **Manual Verification**: Ping the endpoint `curl -i http://localhost:5000/api/v1/health/ready`.

### Mitigation
1. **Enable Maintenance Mode**: Route traffic away from database-dependent APIs by updating CDN/Load Balancer rules to return 503 with a maintenance screen.
2. **Switch to Secondary / Read-Only**: If primary cluster is down, check MongoDB Atlas status page. Switch connection string to Atlas read-only analytics replica to allow historic reads while blocking writes.

### Recovery
1. **Atlas Failover**: Trigger manual failover in MongoDB Atlas console if the cloud provider is experiencing localized issues.
2. **Restore from Backup**: If database corruption has occurred, restore the last snapshot (Atlas Backups retain hourly snapshots):
   - Navigate to **MDB Atlas Console** -> **Database** -> **Backup**.
   - Select the last healthy snapshot (e.g. 15-minute point-in-time recovery window).
   - Click **Restore** -> **Restore to new cluster** (preferred to avoid overwriting operational logs).
3. **Reconnect Backend**: Update the environment variable `MONGO_URI` with the restored cluster credentials and restart service instances.

### Verification
- Call `/ready` and `/health` endpoints to verify success.
- Check log output for `💾 MongoDB Connected` and successful pings.
- Authenticate a test user and run a mock calculation to verify write integrity.

### Rollback Criteria
- If restoring a backup fails or takes longer than the RTO (30 minutes), escalate to tier-3 database administration.
- If data corruption persists on the restored database, isolate the corruption and revert to the read-only replica mode.

---

## 2. Redis Outage Runbook

### Symptoms
- API continues functioning, but log alerts warn of `Redis connection error`.
- Health diagnostics `/health` reports Redis status as `disconnected`.
- background worker logs show jobs being processed via MongoDB polling fallback.
- Idempotency middleware falls back to Mongoose storage (`IdempotentRequest` collection).

### Detection
- **Monitoring**: Datadog/Grafana alert on Redis connection count dropping to 0 or CPU usage anomalies.
- **Diagnostics**: `curl -i http://localhost:5000/api/v1/health` showing `redis.status = "disconnected"`.

### Mitigation
- No immediate manual mitigation is needed. The platform automatically degrades gracefully to MongoDB for both background workers and idempotency caching.
- However, if Mongo load increases dangerously:
  1. Increase database write capacity (Atlas tier upgrade).
  2. Throttle calculator rate-limits using the Load Balancer.

### Recovery
1. **Check Redis Service**: Check local Redis service status or AWS ElastiCache health console.
2. **Restart Redis Instance**:
   - Local: `Start-Service redis` / `Restart-Service redis`.
   - AWS: Trigger reboot of the primary node.
3. **Verify Automatic Reconnect**: Confirm backend logs show `🚀 Redis connection established` without restarting the API cluster.

### Verification
- Trigger a mock calculation with an `Idempotency-Key` header twice. Verify that the second response matches the first and that metrics cache hits increment.
- Monitor Redis console (`redis-cli info stats`) to confirm active connections and cache read/writes.

### Rollback Criteria
- If the Redis cluster is unrecoverable, leave the backend running in its degraded (MongoDB-backed) state until a scheduled maintenance window.

---

## 3. BullMQ Backlog Runbook

### Symptoms
- Background tasks (emails, PDF generations) take minutes or hours to execute.
- User complaints of not receiving verification emails or report downloads.
- Redis memory usage spikes.

### Detection
- **Alerting**: Alert triggers if queue backlog size > 1000 items.
- **Diagnostics**: `/health` reports high queue sizes or worker latency spikes.

### Mitigation
1. **Scale Workers**: Deploy additional instances of the worker process to increase concurrency.
2. **Bulkhead Worker Allocation**: Isolate critical worker queues. Direct all `send-email` jobs to a dedicated worker cluster, leaving `generate-report` jobs on a separate pool.

### Recovery
1. **Purge Non-Critical Jobs**: If the backlog contains dead-loops or unparseable jobs, filter and delete them from the queue using BullMQ dashboard.
2. **Reprocess Failed Jobs**: Inspect BullMQ failed jobs queue. If failures were due to transient SMTP outages, trigger bulk retry.

### Verification
- Verify that background jobs counts drop steadily.
- Confirm report and verification emails arrive within the target 3-minute SLO window.

### Rollback Criteria
- If scaling worker processes causes MongoDB connection exhaustion (overwhelming Mongoose pool), scale back the worker instances immediately.

---

## 4. Object Storage (S3) Outage Runbook

### Symptoms
- Report exports (PDF/CSV) fail or hang.
- Logs show `S3 Upload failed` or AWS client timeout errors.
- `/health` reports storage status as degraded.

### Detection
- **Alerting**: CloudWatch alarm on S3 write failure rates.
- **Manual Verification**: Run health check to check `storage.status` output.

### Mitigation
- The backend automatically falls back to local disk storage (`uploads/reports/`) when S3 fails. No manual intervention is needed for business continuity.
- In multi-instance deployments, sync local uploads directories periodically or enable sticky sessions at the Load Balancer to ensure downloads route to the server holding the local file.

### Recovery
1. **AWS Status Check**: Verify regional S3 status in AWS Health Dashboard.
2. **Credential Rotation**: If S3 access is denied, rotate AWS secrets (see Secret Rotation Runbook).
3. **Re-sync local files**: Once S3 is restored, run the administrative script to sync files from `/uploads` back to the S3 bucket.

### Verification
- Export a PDF report and verify it downloads successfully.
- Verify the saved path in the database matches `s3://` format once S3 is restored.

---

## 5. Failed Deployment Runbook

### Symptoms
- Post-deployment, `/ready` returns 503.
- Container loop crashes (restart loops) or CPU spikes.
- Integration tests fail post-merge.

### Detection
- **CI/CD Dashboard**: GitHub Actions / CircleCI deploy step fails.
- **Kubernetes / ECS**: Target health checks fail, preventing traffic routing.

### Mitigation & Recovery
1. **Trigger Automatic Rollback**: Revert immediately to the last stable container image/tag in the deployment pipeline.
2. **Git Revert**: Revert the offending commit on the main branch, re-triggering the build.
3. **Database Migration Rollback**: If a database schema change was included, run the reverse migration script to restore schema compatibility.

### Verification
- Confirm that `/ready` returns 200 on all newly started instances.
- Verify system logs show normal operational messages.

---

## 6. Secret Rotation Runbook

### Symptoms
- Authorization errors in communications between services.
- Failed startup validations.

### Procedure
1. **Prepare New Secret**: Generate a cryptographically secure key (e.g. `openssl rand -hex 32` for `JWT_SECRET`).
2. **Co-existence Phase**: If rotating JWT_SECRET:
   - Configure the API to *sign* with the new secret, but *decode* using both the new and old secrets to prevent active sessions from being forcibly logged out.
3. **Update Env Configuration**: Update values in the secret store (AWS Secret Manager, Vault, or `.env` files).
4. **Graceful Restart**: Restart backend instances one-by-one to load the new credentials.
5. **Revoke Old Secret**: Remove the old secret from the decoding allowlist after 24 hours (once all old tokens expire).
