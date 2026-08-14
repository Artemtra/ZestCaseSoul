import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [migrationSql, serverSource, scriptSource, htmlSource, stylesSource] = await Promise.all([
  readFile(new URL("../migrations/026_shop_availability.sql", import.meta.url), "utf8"),
  readFile(new URL("../server.js", import.meta.url), "utf8"),
  readFile(new URL("../script.js", import.meta.url), "utf8"),
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../styles.css", import.meta.url), "utf8")
]);

test("shop availability is durable and keeps purchases enabled during migration", () => {
  assert.match(migrationSql, /CREATE TABLE IF NOT EXISTS shop_settings/);
  assert.match(migrationSql, /purchases_enabled TINYINT\(1\) NOT NULL DEFAULT 1/);
  assert.match(migrationSql, /VALUES \(\s*1,\s*1,/);
  assert.match(migrationSql, /disabled_message VARCHAR\(320\) NOT NULL/);
});

test("one cached setting protects both ways to begin a payment", () => {
  assert.match(serverSource, /getCachedPublicData\("shop-availability"[\s\S]{0,650}15_000/);
  assert.match(serverSource, /app\.post\("\/api\/profile\/designs\/pay", requireAuth, requirePurchasesEnabled/);
  assert.match(serverSource, /app\.post\("\/api\/profile\/wallet\/topups", requireAuth, requirePurchasesEnabled/);
  assert.match(serverSource, /code: "PURCHASES_DISABLED"/);
  assert.match(serverSource, /app\.put\("\/api\/admin\/shop-availability", requireAuth, requireAdmin/);
});

test("already started payments remain processable when new purchases are paused", () => {
  const webhookRoute = serverSource.match(/app\.post\("\/api\/payments\/yookassa\/webhook"[^\n]*/)?.[0] || "";
  assert.ok(webhookRoute, "payment webhook route is present");
  assert.doesNotMatch(webhookRoute, /requirePurchasesEnabled/);
  assert.match(serverSource, /captureWalletTopup\(connection, topup\)/);
  assert.match(serverSource, /captureWalletReservation\(connection, order\)/);
});

test("admin has one clear store switch and the customer sees useful copy", () => {
  assert.match(htmlSource, /data-admin-target="shop"[\s\S]{0,180}<strong>Приём заказов<\/strong>/);
  assert.match(htmlSource, /id="adminShopForm"/);
  assert.match(htmlSource, /id="adminPurchasesEnabled"/);
  assert.match(htmlSource, /id="adminPurchasesMessage"/);
  assert.match(htmlSource, /id="shopAvailabilityNotice"/);
  assert.match(htmlSource, /Приём заказов временно приостановлен\. Вы можете создать и сохранить дизайн — оформить покупку можно будет немного позже\./);
  assert.match(stylesSource, /\.shop-status-switch/);
  assert.match(stylesSource, /\.shop-availability-notice/);
});

test("client blocks checkout and topups but still saves designs while paused", () => {
  assert.match(scriptSource, /async function loadShopAvailability/);
  assert.match(scriptSource, /profileWalletTopupButton\.disabled = !enabled/);
  assert.match(scriptSource, /paySelectedDesignsButton\.disabled = count < 2 \|\| !purchasesAreEnabled\(\)/);
  assert.match(scriptSource, /saveProfileChoiceButton\.textContent = purchasesPaused \? "Сохранить в профиль" : "Сохранить и заказать"/);
  assert.match(scriptSource, /if \(!purchasesAreEnabled\(\)\) \{\s*await openProfile\(\);\s*profileMeta\.textContent = `Дизайн сохранён\./);
  assert.match(scriptSource, /loadShopAvailability\(\),\s*checkSession\(\)/);
});
