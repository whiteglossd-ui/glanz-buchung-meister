import { createFileRoute, redirect } from "@tanstack/react-router";
import { consolidatedPaths } from "@/lib/seo-policy";

/**
 * Merged into /dellen-druecken (owner decision 27.11.2026). The 301 keeps
 * existing links and search rankings pointing at the new page.
 */
export const Route = createFileRoute("/dellen-hagelschaden")({
  beforeLoad: () => {
    throw redirect({ href: consolidatedPaths["/dellen-hagelschaden"], statusCode: 301 });
  },
});
