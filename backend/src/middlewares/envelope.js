export const envelope = (req, res, next) => {
  const originalJson = res.json

  res.json = function (body) {
    // If body is null/undefined or already wrapped in success/error fields, let it pass unmodified
    if (
      !body ||
      typeof body !== 'object' ||
      body.success !== undefined ||
      req.originalUrl.startsWith('/api-docs') // Swagger docs shouldn't be wrapped
    ) {
      if (body && typeof body === 'object' && body.requestId === undefined) {
        body.requestId = req.id || null
      }
      res.json = originalJson
      return res.json(body)
    }

    // Standard Success Response Envelope mapping
    const wrapped = {
      success: true,
      status: 'success', // preserve backward compatibility with existing tests
      message: body.message || 'Operation successful.',
      data: body.data !== undefined ? body.data : body,
      ...(body.meta && { meta: body.meta }),
      requestId: req.id || null,
    }

    // Clean up top-level fields if we copied them from body to avoid redundancy
    if (body.data !== undefined && wrapped.data === body.data) {
      // The payload was structured: { data, message, meta }
      // We mapped data, message and meta. We don't want extra fields.
    } else {
      // The payload was a raw array or arbitrary object
      // If we copied it directly, remove message/meta attributes from data if they existed
      if (wrapped.data && typeof wrapped.data === 'object') {
        if (wrapped.data.message !== undefined && wrapped.data.message === wrapped.message) {
          delete wrapped.data.message
        }
        if (wrapped.data.meta !== undefined && wrapped.data.meta === wrapped.meta) {
          delete wrapped.data.meta
        }
      }
    }

    res.json = originalJson
    return res.json(wrapped)
  }

  next()
}

export default envelope
