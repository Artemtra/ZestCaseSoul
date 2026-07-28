import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const serverSource = await readFile(new URL("../server.js", import.meta.url), "utf8");

test("server keeps Russian messages and slugs in UTF-8", () => {
  assert.ok(serverSource.includes("\u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043d\u044b \u0442\u043e\u043b\u044c\u043a\u043e PNG, JPG \u0438 WEBP."));
  assert.ok(serverSource.includes("[^a-z0-9\u0430-\u044f]+"));
  assert.doesNotMatch(serverSource, /\u0420\u00a0\u0420\u00b0/);
});
