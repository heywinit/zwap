"use client";

import { QueryCache, QueryClient } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCClient } from "@trpc/client";
import type { AppRouter } from "@zwap/api/routers/index";
import { toast } from "sonner";

// Query client for React Query
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(error.message, {
        action: {
          label: "retry",
          onClick: () => {
            queryClient.invalidateQueries();
          },
        },
      });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 1000,
    },
  },
});

// Get base URL for API calls
function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

// Get auth headers
function getHeaders() {
  if (typeof window !== "undefined") {
    const session = localStorage.getItem("solana_session");
    if (session) {
      return {
        authorization: `Bearer ${session}`,
      };
    }
  }
  return {};
}

// Create tRPC client for direct usage
export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      headers: getHeaders,
    }),
  ],
});
