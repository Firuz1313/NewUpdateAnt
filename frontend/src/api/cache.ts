// Lightweight cache utility used by API layers to speed up admin pages
// Stores data in memory and (when small) in localStorage with TTL

const memoryCache = new Map<string, { ts: number; data: any }>();

const DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes
const LOCAL_STORAGE_PREFIX = "ant_cache:";
const MAX_LOCAL_STORAGE_VALUE_LENGTH = 4 * 1024 * 1024; // ~4MB guard

function makeKey(key: string) {
  return `${LOCAL_STORAGE_PREFIX}${key}`;
}

export function getCache<T = any>(
  key: string,
  ttlMs: number = DEFAULT_TTL,
): T | null {
  const now = Date.now();
  // memory first
  const mem = memoryCache.get(key);
  if (mem && now - mem.ts < ttlMs) return mem.data as T;

  // localStorage fallback
  try {
    const raw = localStorage.getItem(makeKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.ts === "number" && now - parsed.ts < ttlMs) {
      memoryCache.set(key, { ts: parsed.ts, data: parsed.data });
      return parsed.data as T;
    }
    // stale
    localStorage.removeItem(makeKey(key));
  } catch {
    // ignore parsing errors
  }
  return null;
}

export function setCache<T = any>(key: string, data: T) {
  const payload = { ts: Date.now(), data };
  memoryCache.set(key, payload);
  try {
    const str = JSON.stringify(payload);
    if (str.length <= MAX_LOCAL_STORAGE_VALUE_LENGTH) {
      localStorage.setItem(makeKey(key), str);
    }
  } catch {
    // ignore storage errors (quota, circular etc.)
  }
}

export function invalidateCache(prefix?: string) {
  // memory
  if (!prefix) {
    memoryCache.clear();
  } else {
    for (const k of Array.from(memoryCache.keys())) {
      if (k.startsWith(prefix)) memoryCache.delete(k);
    }
  }

  // localStorage
  try {
    if (!prefix) {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(LOCAL_STORAGE_PREFIX))
        .forEach((k) => localStorage.removeItem(k));
      return;
    }
    const fullPrefix = makeKey(prefix);
    Object.keys(localStorage)
      .filter((k) => k.startsWith(fullPrefix))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

export function buildKey(base: string, params?: any) {
  if (!params) return base;
  try {
    return `${base}:${JSON.stringify(params)}`;
  } catch {
    return base;
  }
}
