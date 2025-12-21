const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");

const { planQuery } = require("./planner/planner");
const { fetchPullRequests } = require("./connectors/github");

const app = express();
app.use(bodyParser.json());

/**
 * POST /v1/query
 * Body:
 * {
 *   "sql": "SELECT * FROM github.pull_requests",
 *   "max_staleness_ms": 30000
 * }
 */
app.post("/v1/query", async (req, res) => {
  const traceId = uuidv4();
  const { sql, max_staleness_ms } = req.body;

  console.log(
    JSON.stringify(
      { traceId, sql, max_staleness_ms },
      null,
      2
    )
  );

  try {
    if (!sql) {
      throw new Error("SQL query is required");
    }

    // 1. Plan the query (parse + validate)
    const plan = planQuery(sql);
    console.log({ traceId, plan: "query planned" });

    // 2. Execute GitHub connector (single-source for now)
    const rows = await fetchPullRequests();
    console.log({ traceId, rowsFetched: rows.length });

    // 3. Build response
    res.json({
      columns: rows.length > 0 ? Object.keys(rows[0]) : [],
      rows,
      freshness_ms: 0,
      rate_limit_status: "OK",
      trace_id: traceId
    });

  } catch (err) {
    console.error({ traceId, error: err.message });

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

