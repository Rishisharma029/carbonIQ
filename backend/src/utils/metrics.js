// Simple thread-safe in-memory metric registry for SLO monitoring

const metricsData = {
  totalRequests: 0,
  failedRequests: 0,
  recoveryDurationMs: 0,
  retrySuccessCount: 0,
  retryFailureCount: 0,
  dlqSize: 0,
  duplicateRequestCount: 0,
  idempotencyCacheHits: 0,
  rollbackCount: 0,
}

export const metrics = {
  incrementRequests(failed = false) {
    metricsData.totalRequests++
    if (failed) {
      metricsData.failedRequests++
    }
  },

  recordRecovery(durationMs) {
    metricsData.recoveryDurationMs = durationMs
  },

  recordRetry(success) {
    if (success) {
      metricsData.retrySuccessCount++
    } else {
      metricsData.retryFailureCount++
    }
  },

  incrementDlq(amount = 1) {
    metricsData.dlqSize = Math.max(0, metricsData.dlqSize + amount)
  },

  decrementDlq(amount = 1) {
    metricsData.dlqSize = Math.max(0, metricsData.dlqSize - amount)
  },

  setDlqSize(size) {
    metricsData.dlqSize = Math.max(0, size)
  },

  incrementDuplicateRequests() {
    metricsData.duplicateRequestCount++
  },

  incrementIdempotencyHits() {
    metricsData.idempotencyCacheHits++
  },

  incrementRollbacks() {
    metricsData.rollbackCount++
  },

  getMetrics() {
    const total = metricsData.totalRequests
    const failed = metricsData.failedRequests
    const availability = total > 0 ? ((total - failed) / total) * 100 : 100.0

    const retrySuccesses = metricsData.retrySuccessCount
    const retryFailures = metricsData.retryFailureCount
    const totalRetries = retrySuccesses + retryFailures
    const retrySuccessRate = totalRetries > 0 ? (retrySuccesses / totalRetries) * 100 : 100.0

    return {
      availabilityPercent: parseFloat(availability.toFixed(3)),
      recoveryDurationMs: metricsData.recoveryDurationMs,
      retrySuccessRatePercent: parseFloat(retrySuccessRate.toFixed(3)),
      retryExhaustionCount: metricsData.retryFailureCount,
      dlqSize: metricsData.dlqSize,
      duplicateRequestCount: metricsData.duplicateRequestCount,
      idempotencyCacheHits: metricsData.idempotencyCacheHits,
      rollbackFrequency: metricsData.rollbackCount,
      raw: { ...metricsData }
    }
  }
}

export default metrics
