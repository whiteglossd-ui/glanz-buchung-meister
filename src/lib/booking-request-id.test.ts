import assert from "node:assert/strict";
import { test } from "node:test";
import { createBookingRequestIdStore } from "./booking-request-id.ts";

const first = "12345678-1234-4234-8234-123456789abc";
const second = "22345678-1234-4234-8234-123456789abc";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}

test("retries and a reload reuse only the persisted request ID", () => {
  const storage = memoryStorage();
  const attempt = createBookingRequestIdStore(
    () => storage,
    () => first,
  );
  assert.equal(storage.values.size, 0);
  assert.equal(attempt.get(), first);
  assert.equal(attempt.get(), first);
  assert.deepEqual([...storage.values.values()], [first]);
  const afterReload = createBookingRequestIdStore(
    () => storage,
    () => second,
  );
  assert.equal(afterReload.get(), first);
  afterReload.clear();
  assert.equal(afterReload.get(), second);
});

test("blocked storage still preserves an ID until the attempt is cleared", () => {
  let generated = 0;
  const attempt = createBookingRequestIdStore(
    () => {
      throw new Error("Storage blocked");
    },
    () => (++generated === 1 ? first : second),
  );
  assert.equal(attempt.get(), first);
  assert.equal(attempt.get(), first);
  attempt.clear();
  assert.equal(attempt.get(), second);
});

test("malformed stored IDs are replaced and invalid generators fail closed", () => {
  const storage = memoryStorage();
  storage.setItem("white-gloss.booking-request.v1", "not-a-uuid");
  assert.equal(
    createBookingRequestIdStore(
      () => storage,
      () => first,
    ).get(),
    first,
  );
  assert.throws(() =>
    createBookingRequestIdStore(
      () => null,
      () => "invalid",
    ).get(),
  );
});

test("request forms keep separate persistent request identities", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
  const first = createBookingRequestIdStore(
    () => storage,
    () => "11111111-1111-4111-8111-111111111111",
    "rundum",
  );
  const second = createBookingRequestIdStore(
    () => storage,
    () => "22222222-2222-4222-8222-222222222222",
    "condition",
  );
  assert.notEqual(first.get(), second.get());
  assert.equal(
    createBookingRequestIdStore(
      () => storage,
      () => "33333333-3333-4333-8333-333333333333",
      "rundum",
    ).get(),
    first.get(),
  );
  first.clear();
  assert.equal(second.get(), "22222222-2222-4222-8222-222222222222");
});
