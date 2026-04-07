/**
 * utils/cache.js
 * In-memory TTL cache dùng chung toàn app
 */
const logger = require("./logger");

class Cache {
  constructor() {
    this.store = new Map();
  }

  set(key, value, ttlSeconds = 30) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    logger.debug(`Cache SET: ${key} (ttl=${ttlSeconds}s)`);
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      logger.debug(`Cache MISS (expired): ${key}`);
      return null;
    }

    logger.debug(`Cache HIT: ${key}`);
    return entry.value;
  }

  del(key) {
    this.store.delete(key);
    logger.debug(`Cache DEL: ${key}`);
  }

  delByPrefix(prefix) {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    if (count > 0)
      logger.debug(`Cache DEL by prefix "${prefix}": ${count} key`);
  }

  flush() {
    this.store.clear();
    logger.info("Cache flushed");
  }

  /**
   * Trả về cached value nếu còn hạn, ngược lại gọi fetchFn và cache kết quả
   */
  async getOrFetch(key, fetchFn, ttlSeconds = 30) {
    const cached = this.get(key);
    if (cached !== null) return cached;
    const fresh = await fetchFn();
    this.set(key, fresh, ttlSeconds);
    return fresh;
  }
}

const cache = new Cache();

// Dọn dẹp expired entries mỗi 60s
setInterval(() => {
  const now = Date.now();
  let count = 0;
  for (const [key, entry] of cache.store.entries()) {
    if (now > entry.expiresAt) {
      cache.store.delete(key);
      count++;
    }
  }
  if (count > 0) logger.debug(`Cache cleanup: xóa ${count} expired entries`);
}, 60_000);

module.exports = cache;
