"use client";

import { Asset, useRouter, useTags } from "@tanstack/react-router";
import type { AssetCrossOriginConfig } from "@tanstack/router-core";
import { isServer } from "@tanstack/router-core/isServer";
import { isModulePreload, prioritizeImagePreloads } from "@/lib/deferred-bootstrap";

export interface PrioritizedHeadContentProps {
  assetCrossOrigin?: AssetCrossOriginConfig;
}

/**
 * Render all Start-managed head assets with their existing keys and CSP nonce.
 * The server prepares only the active homepage module at low priority. Its
 * execution and every other module preload stay behind the existing painted-
 * hero bootstrap gate. The manifest supplies the real current hashed URL.
 */
export function PrioritizedHeadContent(props: PrioritizedHeadContentProps) {
  const tags = prioritizeImagePreloads(useTags(props.assetCrossOrigin));
  const router = useRouter();
  const nonce = router.options.ssr?.nonce;
  const server = isServer ?? router.isServer;
  const earlyRoutePreload = router.state.location.pathname === "/"
    ? router.ssr?.manifest?.routes["/"]?.preloads?.[0]
    : undefined;

  return (
    <>
      {tags.map((tag) => {
        const modulePreload = isModulePreload(tag);
        if (modulePreload && server && tag.attrs?.href !== earlyRoutePreload) return null;

        return (
          <Asset
            {...tag}
            attrs={modulePreload ? { ...tag.attrs, fetchPriority: "low" } : tag.attrs}
            key={`tsr-meta-${JSON.stringify(tag)}`}
            nonce={nonce}
          />
        );
      })}
    </>
  );
}
