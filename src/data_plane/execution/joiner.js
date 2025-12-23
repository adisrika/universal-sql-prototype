function innerJoin(leftRows, rightRows, leftKey, rightKey) {
  const index = new Map();

  for (const row of rightRows) {
    index.set(row[rightKey], row);
  }

  const result = [];

  for (const row of leftRows) {
    const match = index.get(row[leftKey]);
    if (match) {
      result.push({ ...row, ...match });
    }
  }

  return result;
}

module.exports = { innerJoin };
