import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const serverSource = await readFile(new URL("../server.js", import.meta.url), "utf8");

test("public profile lookup requires an authenticated user", () => {
  assert.match(serverSource, /app\.get\("\/api\/users\/:id\/profile", requireAuth,/);
});

test("profile design routes scope reads and writes to req.user.id", () => {
  assert.match(serverSource, /app\.get\("\/api\/profile\/designs", requireAuth,[\s\S]*?WHERE ucd\.user_id = \?[\s\S]*?\[req\.user\.id\]/);
  assert.match(serverSource, /app\.get\("\/api\/profile\/designs\/:id", requireAuth,[\s\S]*?WHERE ucd\.user_id = \? AND ucd\.id = \?[\s\S]*?\[req\.user\.id, id\]/);
  assert.match(serverSource, /INSERT INTO user_case_designs[\s\S]*?\[req\.user\.id, phoneModelId/);
});

test("design creation does not trust a client supplied user id", () => {
  const start = serverSource.indexOf('app.post("/api/profile/designs", requireAuth');
  const end = serverSource.indexOf('app.get("/api/admin/avatars"', start);
  const routeSource = serverSource.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.doesNotMatch(routeSource, /req\.body\.(?:userId|user_id)/);
});
