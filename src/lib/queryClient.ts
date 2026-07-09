import { QueryClient } from "@tanstack/react-query";

/**
 * Shared TanStack Query client. Server state lives here; React Context is kept
 * for session/auth + theme/sidebar UI state only (see governance).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});
