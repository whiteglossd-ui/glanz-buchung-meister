import { googleNativeLoginEnabled } from "./google-oauth.ts";

/** Only a caller checking the running release receives its own random challenge back. */
export function googleReleaseStatus(url: URL, directory = process.cwd()): Response {
  const release = url.searchParams.get("release") ?? "";
  const challenge = url.searchParams.get("challenge") ?? "";
  const headers = { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" };
  const matches = /^[a-f0-9]{40}$/.test(release) &&
    /^[a-f0-9]{32}$/.test(challenge) &&
    directory === `/srv/white-gloss-releases/${release}` &&
    !googleNativeLoginEnabled() &&
    ![process.env.GOOGLE_CLIENT_ID, process.env.VITE_GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET]
      .some(value => value?.trim());
  return matches
    ? new Response(challenge, { headers })
    : new Response(null, { status: 409, headers });
}
