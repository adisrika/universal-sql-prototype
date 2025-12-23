module.exports = {
  github: {
    name: "github",
    tables: ["pull_requests"],
    execute: require("../connectors/github").execute
  },
  jira: {
    name: "jira",
    tables: ["issues"],
    execute: require("../connectors/jira").execute
  }
};
