export interface ICacheService {
  get: <T>(key: string) => Promise<T | null>;
  set: <T>(key: string, value: T) => Promise<void>;
  del: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}
