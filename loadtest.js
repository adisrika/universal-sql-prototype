import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 100 },  // ramp up
    { duration: "40s", target: 100 },  // steady load
    { duration: "10s", target: 0 }     // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"]  // 95% < 500ms
  }
};

export default function () {
  const payload = JSON.stringify({
    sql: "SELECT id, title FROM github.pull_requests",
    max_staleness_ms: 30000
  });

  const params = {
    headers: {
      "Content-Type": "application/json"
    }
  };

  const res = http.post(
    "http://localhost:3000/v1/query",
    payload,
    params
  );

  check(res, {
    "status is 200 or 429": (r) =>
      r.status === 200 || r.status === 429
  });

  sleep(0.01);
}
