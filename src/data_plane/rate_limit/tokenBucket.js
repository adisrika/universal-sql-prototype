class TokenBucket {
  constructor(ratePerSecond) {
    this.capacity = ratePerSecond;
    this.tokens = ratePerSecond;
    this.lastRefill = Date.now();
    this.refillIntervalMs = 1000;
  }

  refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;

    if (elapsed >= this.refillIntervalMs) {
      const refillCount = Math.floor(elapsed / this.refillIntervalMs);
      this.tokens = Math.min(
        this.capacity,
        this.tokens + refillCount * this.capacity
      );
      this.lastRefill = now;
    }
  }

  consume() {
    this.refill();

    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }
    return false;
  }
}

module.exports = { TokenBucket };