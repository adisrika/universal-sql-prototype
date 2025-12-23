const client = require("prom-client");

// Default process metrics (CPU, memory, etc.)
client.collectDefaultMetrics();

// Counter: how many connector calls
const connectorRequestsTotal = new client.Counter({
  name: "connector_requests_total",
  help: "Total connector executions",
  labelNames: ["source"]
});

// Histogram: connector latency
const connectorLatencyMs = new client.Histogram({
  name: "connector_latency_ms",
  help: "Connector execution latency in milliseconds",
  labelNames: ["source"],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500]
});

module.exports = {
  connectorRequestsTotal,
  connectorLatencyMs,
  register: client.register
};
