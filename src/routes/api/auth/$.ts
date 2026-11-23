import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        if (url.pathname === "/api/auth/google-release-status") {
          const { googleReleaseStatus } = await import("@/lib/auth/google-release-status.server");
          return googleReleaseStatus(url);
        }
        return auth.handler(request);
      },
      POST: ({ request }) => auth.handler(request),
    },
  },
});
