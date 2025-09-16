import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";

// Suppress harmless ResizeObserver warnings
window.addEventListener("error", (e) => {
  if (e.message.includes("ResizeObserver loop")) {
    e.stopImmediatePropagation();
  }
});

// Suppress React Router future flag warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.("React Router Future Flag Warning")) {
    return;
  }
  originalWarn.apply(console, args);
};

// 🔧 FIX: Create a client with anti-restart optimizations
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 🔧 FIX: Increase stale time to prevent aggressive refetching
      staleTime: 10 * 60 * 1000, // 10 minutes
      // 🔧 FIX: Increase cache time to prevent data loss during restarts
      cacheTime: 15 * 60 * 1000, // 15 minutes
      // 🔧 FIX: Enable background refetch to prevent blocking UI
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
      refetchInterval: false,
      // 🔧 FIX: Reduce retry attempts to prevent retry loops
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors except 408 (timeout) and 429 (rate limit)
        if (error && typeof error === "object" && "status" in error) {
          const status = error.status as number;
          if (
            status >= 400 &&
            status < 500 &&
            status !== 408 &&
            status !== 429
          ) {
            return false;
          }
          // Allow retry for 429 rate limiting
          if (status === 429) {
            return failureCount < 1; // 🔧 FIX: Reduce retry count
          }
        }
        return failureCount < 2; // 🔧 FIX: Reduce from 3 to 2
      },
      retryDelay: (attemptIndex, error) => {
        // 🔧 FIX: Increase initial delay to prevent rapid retries
        if (error && typeof error === "object" && "status" in error) {
          const status = error.status as number;
          if (status === 429) {
            return Math.min(3000 * Math.pow(2, attemptIndex), 15000); // 🔧 FIX: Longer delays
          }
        }
        return Math.min(2000 * Math.pow(2, attemptIndex), 10000); // 🔧 FIX: Longer base delay
      },
    },
    mutations: {
      retry: false, // 🔧 FIX: Disable mutation retries to prevent loops
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
);
