"use client";

import { Asset, useRouter, useTags } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getAssetCrossOrigin, type AssetCrossOriginConfig } from "@tanstack/router-core";
import { isServer } from "@tanstack/router-core/isServer";
import { tsrStartManifest } from "tanstack-start-manifest:v";
import { isHomepageRoute, isModulePreload, prioritizeImagePreloads, selectHomepageCssPreload } from "@/lib/deferred-bootstrap";

// Start strips inlined stylesheets from its rendered manifest. Read the build
// manifest only on the server to prepare the same client asset without applying it.
const homepageCssPreload = createIsomorphicFn()
  .server((pathname: string) => {
    const manifest = tsrStartManifest();
    return selectHomepageCssPreload(manifest.routes[pathname]?.css, manifest.inlineCss?.styles);
  })
  .client((_pathname: string) => undefined);

export interface PrioritizedHeadContentProps {
  assetCrossOrigin?: AssetCrossOriginConfig;
}

/**
 * Render all Start-managed head assets with their existing keys and CSP nonce.
 * The server prepares the homepage module and its existing client stylesheet
 * at high priority, using their manifest URLs. The bulk entry is fetched only
 * by the painted-viewport bootstrap; even a low-priority modulepreload competes
 * with fonts and schedules parsing during the first paint.
 * Styles remain inline; execution and the remaining module preloads stay
 * behind the existing painted-hero bootstrap gate.
 */
export function PrioritizedHeadContent(props: PrioritizedHeadContentProps) {
  const tags = prioritizeImagePreloads(useTags(props.assetCrossOrigin));
  const router = useRouter();
  const nonce = router.options.ssr?.nonce;
  const server = isServer ?? router.isServer;
  const pathname = router.state.location.pathname;
  const home = isHomepageRoute(pathname);
  const earlyRoutePreload = home
    ? router.ssr?.manifest?.routes[pathname]?.preloads?.[0]
    : undefined;
  const earlyCssPreload = home ? homepageCssPreload(pathname) : undefined;

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
