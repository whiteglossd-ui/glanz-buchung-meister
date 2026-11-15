"use client";

import { Asset, useRouter, useTags } from "@tanstack/react-router";
import { _getAssetMatches, type AssetCrossOriginConfig } from "@tanstack/router-core";
import { isServer } from "@tanstack/router-core/isServer";
import { isModuleEntry, isModulePreload, prioritizeImagePreloads } from "@/lib/deferred-bootstrap";

export interface PrioritizedHeadContentProps {
  assetCrossOrigin?: AssetCrossOriginConfig;
}

/**
 * Render all Start-managed head assets with their existing keys and CSP nonce.
 * The server prepares the active homepage module at high priority and starts
 * fetching its client entry at low priority. The entry does not execute until
 * the existing painted-hero bootstrap gate opens. Both URLs come from Start's
 * current manifest, so this adds no hard-coded asset or second execution.
 */
export function PrioritizedHeadContent(props: PrioritizedHeadContentProps) {
  const tags = prioritizeImagePreloads(useTags(props.assetCrossOrigin));
  const router = useRouter();
  const nonce = router.options.ssr?.nonce;
  const server = isServer ?? router.isServer;
  const earlyRoutePreload = router.state.location.pathname === "/"
    ? router.ssr?.manifest?.routes["/"]?.preloads?.[0]
    : undefined;
  const earlyEntries = server && router.state.location.pathname === "/"
    ? [...new Set(_getAssetMatches(router.stores.matches.get())
        .flatMap((match) => router.ssr?.manifest?.routes[match.routeId]?.scripts ?? [])
        .filter((asset) => isModuleEntry({ tag: "script", attrs: asset.attrs, children: asset.children }))
        .map((tag) => String(tag.attrs?.src)))]
    : [];

  return (
    <>
      {tags.map((tag) => {
        const modulePreload = isModulePreload(tag);
        if (modulePreload && server && tag.attrs?.href !== earlyRoutePreload) return null;

        return (
          <Asset
            {...tag}
            attrs={modulePreload ? {
              ...tag.attrs,
              fetchPriority: server && tag.attrs?.href === earlyRoutePreload ? "high" : "low",
            } : tag.attrs}
            key={`tsr-meta-${JSON.stringify(tag)}`}
            nonce={nonce}
          />
        );
      })}
      {earlyEntries.map((href) => (
        <link
          key={`client-entry-preload-${href}`}
          rel="modulepreload"
          href={href}
          fetchPriority="low"
          nonce={nonce}
        />
      ))}
    </>
  );
}
