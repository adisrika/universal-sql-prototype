const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");

const { planQuery } = require("../planner/planner");
const { executePlan } = require("../execution/executor");
const { resolveTenantContext } = require("../../control_plane/tenant_context");
const { register } =
  require("../observability/metrics");


const app = express();
app.use(bodyParser.json());

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

/**
 * POST /v1/query
 *
 * Body:
 * {
 *   "sql": "SELECT * FROM github.pull_requests",
 *   "max_staleness_ms": 30000
 * }
 */
app.post("/v1/query", async (req, res) => {
  const traceId = uuidv4();
  const { sql, max_staleness_ms } = req.body;

  // Resolve tenant + user identity (mocked for prototype)
  const tenantContext = resolveTenantContext(req);

  console.log(
    JSON.stringify(
      { traceId, sql, max_staleness_ms, tenantContext },
      null,
      2
    )
  );

  try {
    if (!sql) {
      throw new Error("SQL query is required");
    }

    // 1. Plan the query (parse + validate + source detection)
    const plan = planQuery(sql);

    // 2. Execute query plan generically across connectors
    const results = await executePlan({
      plan,
      tenantContext,
      max_staleness_ms: max_staleness_ms ?? 0
    });

    // NOTE:
    // Prototype currently returns a single source result.
    // Cross-source joins will be added in the next step.
    const rows = results.rows || [];

    console.log({ traceId, rowsFetched: rows.length });

    console.log({
      traceId,
      cache_source: results.cache_source,
      freshness_ms: results.freshness_ms
    });

    // 3. Build response
    res.json({
      columns: rows.length > 0 ? Object.keys(rows[0]) : [],
      rows,
      freshness_ms: results.freshness_ms,
      cache_source: results.cache_source,
      rate_limit_status: "OK",
      trace_id: traceId
    });


  } catch (err) {
    console.error({ traceId, error: err.message });

    if (err.code === "RATE_LIMIT_EXHAUSTED") {
      return res.status(429).json({
        error: "RATE_LIMIT_EXHAUSTED",
        source: err.source,
        retry_after_ms: err.retry_after_ms,
        trace_id: traceId
      });
    }

    res.status(400).json({
      error: "QUERY_FAILED",
      message: err.message,
      trace_id: traceId
    });
  }
});

app.listen(3000, () => {
  console.log("🚀 Query Gateway listening on http://localhost:3000");
});