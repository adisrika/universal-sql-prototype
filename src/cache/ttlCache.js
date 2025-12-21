const { LRUCache } = require("lru-cache");

const cache = new LRUCache({
  max: 100,
  ttl: 30000
});

module.exports = { cache };

