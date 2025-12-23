const { TokenBucket } = require("./tokenBucket");
const connectorRegistry = require("../../control_plane/connector_registry");

const buckets = {};

/**
 * Enforce per-connector rate limits.
 * Throws RATE_LIMIT_EXHAUSTED when limit is hit.
 */
function checkRateLimit(source) {
  const connector = connectorRegistry[source];
  if (!connector || !connector.rateLimitPerSecond) {
    return;
  }

  if (!buckets[source]) {
    buckets[source] = new TokenBucket(connector.rateLimitPerSecond);
  }

  const allowed = buckets[source].consume();
  if (!allowed) {
    const err = new Error(`Rate limit exhausted for ${source}`);
    err.code = "RATE_LIMIT_EXHAUSTED";
    err.source = source;
    err.retry_after_ms = 1000;
    throw err;
  }
}

module.exports = { checkRateLimit };