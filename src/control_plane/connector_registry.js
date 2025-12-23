module.exports = {
  github: {
    name: "github",
    tables: ["pull_requests"],
    rateLimitPerSecond: 2,
    execute: require("../connectors/github").execute
  },
  jira: {
    name: "jira",
    tables: ["issues"],
    rateLimitPerSecond: 2,
    execute: require("../connectors/jira").execute
  }
};
