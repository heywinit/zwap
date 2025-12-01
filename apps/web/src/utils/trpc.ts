"use client";

import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@zwap/api/routers/index";
import { toast } from "sonner";

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
});

// Create tRPC client factory function
function createClient() {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: "/api/trpc",
        headers() {
          // Send session in Authorization header as fallback
          if (typeof window !== "undefined") {
            const session = localStorage.getItem("solana_session");
            if (session) {
              return {
                authorization: `Bearer ${session}`,
              };
            }
          }
          return {};
        },
      }),
    ],
  });
}

// Create tRPC client for direct use (outside React components)
export const trpcClient = createClient();

// Create tRPC React context
export const trpcContext = createTRPCContext<AppRouter>();

// Export trpc hook for use in components
// In tRPC v11, you must use the hook to get the trpc proxy
export const useTRPC = trpcContext.useTRPC;

// For backward compatibility, create a helper that throws a helpful error
// Components should use: const trpc = useTRPC();
export const trpc = new Proxy({} as ReturnType<typeof trpcContext.useTRPC>, {
  get() {
    throw new Error(
      "trpc must be used within a React component. Use: const trpc = useTRPC();"
    );
  },
});
