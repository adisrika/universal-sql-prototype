class TokenBucket {
  constructor(limit) {
    this.limit = limit;
    this.tokens = limit;
    setInterval(() => {
      this.tokens = this.limit;
    }, 1000);
  }

  consume() {
    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }
    return false;
  }
}

module.exports = { TokenBucket };

