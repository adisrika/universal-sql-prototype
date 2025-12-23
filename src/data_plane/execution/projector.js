function applyProjection(rows, projection) {
  if (!projection) {
    return rows;
  }

  return rows.map(row => {
    const projected = {};
    for (const { column } of projection) {
      if (column in row) {
        projected[column] = row[column];
      }
    }
    return projected;
  });
}

module.exports = { applyProjection };
