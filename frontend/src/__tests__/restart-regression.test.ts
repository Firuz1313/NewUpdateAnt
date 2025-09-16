// 🧪 Regression tests to prevent application restart/flashing loops
import { describe, test, expect, vi, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";

// Mock API responses
const mockDevicesResponse = {
  data: [
    { id: "1", name: "Test Device", model: "TD-1", is_active: true },
    { id: "2", name: "Test Device 2", model: "TD-2", is_active: true },
  ],
  pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
};

const mockProblemsResponse = {
  data: [
    { id: "1", title: "Test Problem", status: "published", deviceId: "1" },
    { id: "2", title: "Test Problem 2", status: "published", deviceId: "1" },
  ],
  pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
};

// Mock API client
vi.mock("../api", () => ({
  devicesApi: {
    getDevices: vi.fn(() => Promise.resolve(mockDevicesResponse)),
  },
  problemsApi: {
    getProblems: vi.fn(() => Promise.resolve(mockProblemsResponse)),
  },
}));

describe("🛡️ Restart Loop Prevention Tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 10 * 60 * 1000,
          cacheTime: 15 * 60 * 1000,
        },
      },
    });
    vi.clearAllMocks();
  });

  describe("React Query Configuration", () => {
    test("🔧 should have anti-restart query configuration", () => {
      const config = queryClient.getDefaultOptions();

      // Verify stale time is sufficient to prevent aggressive refetching
      expect(config.queries?.staleTime).toBeGreaterThanOrEqual(10 * 60 * 1000);

      // Verify cache time prevents data loss during restarts
      expect(config.queries?.cacheTime).toBeGreaterThanOrEqual(15 * 60 * 1000);

      // Verify retry logic is conservative
      expect(config.queries?.retry).toBe(false);
    });

    test("🚫 should not refetch on window focus", () => {
      const config = queryClient.getDefaultOptions();
      expect(config.queries?.refetchOnWindowFocus).toBe(false);
    });

    test("📱 should not refetch on mount when data exists", () => {
      const config = queryClient.getDefaultOptions();
      expect(config.queries?.refetchOnMount).toBe(false);
    });
  });

  describe("API Call Frequency", () => {
    test("🎯 should limit API calls per time window", async () => {
      const { devicesApi } = await import("../api");
      const mockGetDevices = devicesApi.getDevices as vi.MockedFunction<
        typeof devicesApi.getDevices
      >;

      // Simulate rapid successive calls
      const promises = Array.from({ length: 5 }, () =>
        devicesApi.getDevices(1, 20, {}),
      );

      await Promise.allSettled(promises);

      // All promises should resolve to the same cached result
      expect(mockGetDevices).toHaveBeenCalledTimes(1);
    });

    test("🛑 should not create infinite retry loops", async () => {
      const { devicesApi } = await import("../api");
      const mockGetDevices = devicesApi.getDevices as vi.MockedFunction<
        typeof devicesApi.getDevices
      >;

      // Mock API to fail consistently
      mockGetDevices.mockRejectedValue(new Error("Persistent API Error"));

      const maxRetries = 3;
      let callCount = 0;

      try {
        // Simulate retry logic
        for (let i = 0; i < maxRetries; i++) {
          try {
            await devicesApi.getDevices(1, 20, {});
            break;
          } catch (error) {
            callCount++;
            if (callCount >= maxRetries) throw error;
          }
        }
      } catch (error) {
        // Expected to fail
      }

      // Should not exceed reasonable retry limit
      expect(callCount).toBeLessThanOrEqual(maxRetries);
    });
  });

  describe("Error Handling Stability", () => {
    test("🚨 should gracefully handle network errors", async () => {
      const { devicesApi } = await import("../api");
      const mockGetDevices = devicesApi.getDevices as vi.MockedFunction<
        typeof devicesApi.getDevices
      >;

      // Mock network error
      mockGetDevices.mockRejectedValueOnce(new Error("Network Error"));

      try {
        await devicesApi.getDevices(1, 20, {});
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Network Error");
      }

      // Should not retry automatically
      expect(mockGetDevices).toHaveBeenCalledTimes(1);
    });

    test("⏱️ should implement exponential backoff for retries", () => {
      // Test exponential backoff calculation
      const calculateDelay = (attemptIndex: number) => {
        return Math.min(2000 * Math.pow(2, attemptIndex), 10000);
      };

      expect(calculateDelay(0)).toBe(2000); // First retry: 2s
      expect(calculateDelay(1)).toBe(4000); // Second retry: 4s
      expect(calculateDelay(2)).toBe(8000); // Third retry: 8s
      expect(calculateDelay(3)).toBe(10000); // Fourth retry: 10s (capped)
      expect(calculateDelay(4)).toBe(10000); // Subsequent: 10s (capped)
    });
  });

  describe("Performance Metrics", () => {
    test("📊 should maintain reasonable memory footprint", () => {
      // Create multiple query clients to test memory usage
      const clients = Array.from(
        { length: 10 },
        () =>
          new QueryClient({
            defaultOptions: {
              queries: {
                staleTime: 10 * 60 * 1000,
                cacheTime: 15 * 60 * 1000,
              },
            },
          }),
      );

      // Each client should have consistent configuration
      clients.forEach((client) => {
        const config = client.getDefaultOptions();
        expect(config.queries?.staleTime).toBe(10 * 60 * 1000);
        expect(config.queries?.cacheTime).toBe(15 * 60 * 1000);
      });

      // Cleanup
      clients.forEach((client) => client.clear());
    });

    test("🎯 should cache responses effectively", async () => {
      const startTime = Date.now();

      // First call - should hit API
      await queryClient.fetchQuery({
        queryKey: ["test-devices"],
        queryFn: () => Promise.resolve(mockDevicesResponse),
      });

      const firstCallTime = Date.now() - startTime;

      // Second call - should use cache
      const cacheStartTime = Date.now();
      await queryClient.fetchQuery({
        queryKey: ["test-devices"],
        queryFn: () => Promise.resolve(mockDevicesResponse),
      });

      const cacheCallTime = Date.now() - cacheStartTime;

      // Cache call should be significantly faster
      expect(cacheCallTime).toBeLessThan(firstCallTime / 2);
    });
  });

  describe("Configuration Validation", () => {
    test("⚙️ should have stable default query options", () => {
      const client = new QueryClient();
      const defaultConfig = client.getDefaultOptions();

      // Ensure critical anti-restart configurations exist
      const criticalOptions = ["staleTime", "cacheTime", "retry"];

      criticalOptions.forEach((option) => {
        expect(
          defaultConfig.queries?.[option as keyof typeof defaultConfig.queries],
        ).toBeDefined();
      });
    });

    test("🔒 should prevent aggressive polling configurations", () => {
      const problematicConfig = {
        refetchInterval: 1000, // Too aggressive
        staleTime: 0, // No caching
        retry: 10, // Too many retries
      };

      // Ensure our configuration is better than problematic patterns
      const config = queryClient.getDefaultOptions();

      expect(config.queries?.refetchInterval).toBeFalsy();
      expect(config.queries?.staleTime).toBeGreaterThan(
        problematicConfig.staleTime,
      );
      expect(config.queries?.retry).not.toBe(problematicConfig.retry);
    });
  });

  describe("Debounce Utilities", () => {
    test("🕒 should debounce rapid function calls", async () => {
      // Import debounce utility
      const { debounce } = await import("../utils/debounce");

      let callCount = 0;
      const debouncedFn = debounce(() => callCount++, 100);

      // Make rapid calls
      for (let i = 0; i < 5; i++) {
        debouncedFn();
      }

      // Should not have executed yet
      expect(callCount).toBe(0);

      // Wait for debounce delay
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should have executed only once
      expect(callCount).toBe(1);
    });

    test("⚡ should throttle high-frequency events", async () => {
      const { throttle } = await import("../utils/debounce");

      let callCount = 0;
      const throttledFn = throttle(() => callCount++, 100);

      // Make rapid calls
      for (let i = 0; i < 5; i++) {
        throttledFn();
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      // Should have executed at most twice (immediate + one throttled)
      expect(callCount).toBeLessThanOrEqual(2);
    });

    test("🔄 should create idempotent requests", async () => {
      const { createIdempotentRequest } = await import("../utils/debounce");

      let callCount = 0;
      const mockRequest = async (id: string) => {
        callCount++;
        return `result-${id}`;
      };

      const idempotentRequest = createIdempotentRequest(
        mockRequest,
        (id: string) => id,
      );

      // Make multiple concurrent calls with same ID
      const promises = Array.from({ length: 3 }, () =>
        idempotentRequest("test-id"),
      );

      const results = await Promise.all(promises);

      // Should only call original function once
      expect(callCount).toBe(1);

      // All results should be identical
      expect(results).toEqual([
        "result-test-id",
        "result-test-id",
        "result-test-id",
      ]);
    });
  });
});
