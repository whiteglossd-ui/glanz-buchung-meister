"use client";

import { Asset, useRouter, useTags } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { _getAssetMatches, getAssetCrossOrigin, resolveManifestCssLink, type AssetCrossOriginConfig } from "@tanstack/router-core";
import { isServer } from "@tanstack/router-core/isServer";
import { tsrStartManifest } from "tanstack-start-manifest:v";
import { isModuleEntry, isModulePreload, prioritizeImagePreloads } from "@/lib/deferred-bootstrap";

// Start strips inlined stylesheets from its rendered manifest. Read the build
// manifest only on the server to prepare the same client asset without applying it.
const homepageCssPreload = createIsomorphicFn()
  .server(() => {
    const manifest = tsrStartManifest();
    const stylesheet = manifest.routes["/"]?.css?.[0];
    if (!stylesheet) return undefined;
    const link = resolveManifestCssLink(stylesheet);
    return manifest.inlineCss?.styles[link.href] === undefined ? undefined : link;
  })
  .client(() => undefined);

export interface PrioritizedHeadContentProps {
  assetCrossOrigin?: AssetCrossOriginConfig;
}

/**
 * Render all Start-managed head assets with their existing keys and CSP nonce.
 * The server prepares the homepage module and its existing client stylesheet
 * at high priority and its entry at low priority, using their manifest URLs.
 * Styles remain inline; execution and the remaining module preloads stay
 * behind the existing painted-hero bootstrap gate.
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
  const earlyCssPreload = router.state.location.pathname === "/" ? homepageCssPreload() : undefined;

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
          crossOrigin={getAssetCrossOrigin(props.assetCrossOrigin, "script")}
          nonce={nonce}
        />
      ))}
      {earlyCssPreload ? (
        <Asset
          tag="link"
          attrs={{
            rel: "preload",
            as: "style",
            href: earlyCssPreload.href,
            fetchPriority: "high",
            crossOrigin: getAssetCrossOrigin(props.assetCrossOrigin, "stylesheet")
              ?? earlyCssPreload.crossOrigin ?? "anonymous",
          }}
          nonce={nonce}
        />
      ) : null}
    </>
  );
}
