import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { googleReleaseStatus } from "./google-release-status.server.ts";
import { googleNativeLoginEnabled, googleOAuthCredentials } from "./google-oauth.ts";

describe("native Google OAuth credentials", () => {
  it("is off when env and embed are empty", () => {
    const prevId = process.env.GOOGLE_CLIENT_ID;
    const prevSecret = process.env.GOOGLE_CLIENT_SECRET;
    const prevVite = process.env.VITE_GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.VITE_GOOGLE_CLIENT_ID;
    try {
      assert.equal(googleOAuthCredentials(), null);
      assert.equal(googleNativeLoginEnabled(), false);
    } finally {
      if (prevId === undefined) delete process.env.GOOGLE_CLIENT_ID;
      else process.env.GOOGLE_CLIENT_ID = prevId;
      if (prevSecret === undefined) delete process.env.GOOGLE_CLIENT_SECRET;
      else process.env.GOOGLE_CLIENT_SECRET = prevSecret;
      if (prevVite === undefined) delete process.env.VITE_GOOGLE_CLIENT_ID;
      else process.env.VITE_GOOGLE_CLIENT_ID = prevVite;
    }
  });

  it("reads client id and secret from env", () => {
    const prevId = process.env.GOOGLE_CLIENT_ID;
    const prevSecret = process.env.GOOGLE_CLIENT_SECRET;
    process.env.GOOGLE_CLIENT_ID = "id.apps.googleusercontent.com";
    process.env.GOOGLE_CLIENT_SECRET = "secret-value";
    try {
      assert.deepEqual(googleOAuthCredentials(), {
        clientId: "id.apps.googleusercontent.com",
        clientSecret: "secret-value",
      });
      assert.equal(googleNativeLoginEnabled(), true);
    } finally {
      if (prevId === undefined) delete process.env.GOOGLE_CLIENT_ID;
      else process.env.GOOGLE_CLIENT_ID = prevId;
      if (prevSecret === undefined) delete process.env.GOOGLE_CLIENT_SECRET;
      else process.env.GOOGLE_CLIENT_SECRET = prevSecret;
    }
  });
});

describe("deployment check for disabled Google login", () => {
  const sha = "d".repeat(40);
  const directory = `/srv/white-gloss-releases/${sha}`;
  const challenge = "1".repeat(32);
  const url = new URL(`https://white-gloss.de/api/auth/google-release-status?release=${sha}&challenge=${challenge}`);

  it("confirms only the matching release with a fresh challenge and no Google configuration", async () => {
    const names = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "VITE_GOOGLE_CLIENT_ID"];
    const previousValues = names.map(name => process.env[name]);
    try {
      for (const name of names) delete process.env[name];
      const response = googleReleaseStatus(url, directory);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal(await response.text(), challenge);
      assert.equal(googleReleaseStatus(url, "/srv/white-gloss-current").status, 409);
      assert.equal(googleReleaseStatus(new URL("https://white-gloss.de"), directory).status, 409);
      for (const name of names) {
        process.env[name] = "fixture";
        assert.equal(googleReleaseStatus(url, directory).status, 409);
        delete process.env[name];
      }
      process.env.GOOGLE_CLIENT_ID = "id";
      process.env.GOOGLE_CLIENT_SECRET = "fixture";
      assert.equal(googleReleaseStatus(url, directory).status, 409);
    } finally {
      for (const [i, name] of names.entries()) {
        if (previousValues[i] === undefined) delete process.env[name];
        else process.env[name] = previousValues[i];
      }
    }
  });
});
