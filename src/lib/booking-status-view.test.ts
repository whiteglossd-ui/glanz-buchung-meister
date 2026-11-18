import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatStatusMoney, statusLinkState, statusPageHeading } from "./booking-status-view.ts";

describe("status link states", () => {
  it("treats a Vorgang with a token as ready", () => {
    assert.equal(statusLinkState("WG-42", "abc"), "ready");
    assert.equal(statusPageHeading("WG-42"), "Auftrag WG-42");
  });

  it("separates a missing link from an incomplete one", () => {
    assert.equal(statusLinkState("", ""), "missing");
    assert.equal(statusLinkState("WG-42", "   "), "incomplete");
    assert.equal(statusLinkState("", "token"), "incomplete");
    assert.equal(statusLinkState("WG-", "token"), "incomplete");
    assert.equal(statusPageHeading(""), "Ihr Auftragsstatus");
  });

  it("formats cents as euros", () => {
    assert.equal(formatStatusMoney(89900), "899,00\u00a0€");
  });
});
