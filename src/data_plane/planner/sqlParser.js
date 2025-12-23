const { Parser } = require("node-sql-parser");
const parser = new Parser();

function parseSQL(sql) {
  const ast = parser.astify(sql, { database: "mysql" });
  if (ast.type !== "select") {
    throw new Error("Only SELECT queries supported");
  }
  return ast;
}

module.exports = { parseSQL };

