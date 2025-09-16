// 🔧 FIX: Debounce utility to prevent rapid API calls during restarts
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// 🔧 FIX: Throttle utility for high-frequency events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// 🔧 FIX: Idempotent request utility
export function createIdempotentRequest<
  T extends (...args: any[]) => Promise<any>,
>(requestFn: T, keyExtractor: (...args: Parameters<T>) => string): T {
  const pendingRequests = new Map<string, Promise<any>>();

  return ((...args: Parameters<T>) => {
    const key = keyExtractor(...args);

    if (pendingRequests.has(key)) {
      return pendingRequests.get(key)!;
    }

    const promise = requestFn(...args).finally(() => {
      pendingRequests.delete(key);
    });

    pendingRequests.set(key, promise);
    return promise;
  }) as T;
}
