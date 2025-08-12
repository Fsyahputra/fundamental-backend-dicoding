import type { ICacheService } from '../types/cache.js';
import { createClient } from 'redis';

class CacheServiceRedisImpl implements ICacheService {
  private client: ReturnType<typeof createClient>;
  private readonly ttl: number;

  constructor(redisUrl: string, ttl: number = 3600) {
    this.client = createClient({ url: redisUrl });
    this.client.on('error', (err) => console.error('Redis Client Error', err));
    this.client.connect();
    this.ttl = ttl;
  }

  public async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  public async set<T>(key: string, value: T): Promise<void> {
    const stringValue = JSON.stringify(value);
    await this.client.setEx(key, this.ttl, stringValue);
  }

  public async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  public async clear(): Promise<void> {
    await this.client.flushAll();
  }
}

export default CacheServiceRedisImpl;
