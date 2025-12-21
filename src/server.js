const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(bodyParser.json());

app.post("/v1/query", async (req, res) => {
  const traceId = uuidv4();
  const { sql, max_staleness_ms } = req.body;

  console.log({ traceId, sql }, "received query");

  res.json({
    columns: [],
    rows: [],
    freshness_ms: 0,
    rate_limit_status: "OK",
    trace_id: traceId
  });
});

app.listen(3000, () => {
  console.log("Query Gateway listening on port 3000");
});

