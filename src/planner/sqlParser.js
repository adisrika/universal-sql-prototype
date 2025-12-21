const { Parser } = require("node-sql-parser");
const parser = new Parser();

function parseSQL(sql) {
  const ast = parser.astify(sql);
  if (ast.type !== "select") {
    throw new Error("Only SELECT supported");
  }
  return ast;
}

module.exports = { parseSQL };

