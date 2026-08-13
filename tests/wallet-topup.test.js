import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [migrationSql, serverSource, scriptSource, htmlSource, stylesSource, mobileStylesSource] = await Promise.all([
  readFile(new URL("../migrations/025_wallet_topups.sql", import.meta.url), "utf8"),
  readFile(new URL("../server.js", import.meta.url), "utf8"),
  readFile(new URL("../script.js", import.meta.url), "utf8"),
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../styles.css", import.meta.url), "utf8"),
  readFile(new URL("../mobile.css", import.meta.url), "utf8")
]);

test("wallet topups have a durable payment record and useful indexes", () => {
  assert.match(migrationSql, /CREATE TABLE IF NOT EXISTS wallet_topups/);
  assert.match(migrationSql, /status ENUM\('pending', 'succeeded', 'canceled', 'failed'\)/);
  assert.match(migrationSql, /UNIQUE KEY uq_wallet_topups_payment \(payment_provider, payment_id\)/);
  assert.match(migrationSql, /UNIQUE KEY uq_wallet_topups_idempotence \(payment_idempotence_key\)/);
  assert.match(migrationSql, /KEY idx_wallet_topups_user_status_created \(user_id, status, created_at\)/);
});

test("authenticated topups validate amount and create a YooKassa payment", () => {
  assert.match(serverSource, /app\.post\("\/api\/profile\/wallet\/topups", requireAuth/);
  assert.match(serverSource, /amount < 10 \|\| amount > 100_000/);
  assert.match(serverSource, /Number\(pendingRows\[0\]\.total\) >= 5/);
  assert.match(serverSource, /type: "wallet_topup"/);
  assert.match(serverSource, /returnUrl: `\$\{appUrl\}\/profile\?walletTopup=return/);
  assert.doesNotMatch(serverSource, /UPDATE users SET wallet_balance = \? WHERE id = \?[\s\S]{0,250}app\.post\("\/api\/profile\/wallet\/topups"/);
});

test("topup webhook verifies YooKassa and credits the ledger only once", () => {
  assert.match(serverSource, /async function fetchYookassaPayment/);
  assert.match(serverSource, /const object = paymentTestMode \? webhookObject : await fetchYookassaPayment\(paymentId\)/);
  assert.match(serverSource, /metadataMatches[\s\S]{0,320}captureWalletTopup\(connection, topup\)/);
  assert.match(serverSource, /topup:\$\{topup\.id\}:capture/);
  assert.match(serverSource, /UPDATE wallet_topups SET status = 'succeeded'/);
  assert.match(serverSource, /topup\.status === "succeeded"/);
  assert.match(serverSource, /const isSucceeded = object\.status === "succeeded" && object\.paid !== false/);
  assert.doesNotMatch(serverSource, /eventType === "payment\.(succeeded|canceled)" \|\| object\.status/);
});

test("wallet balance and topup entry points are visible in the header and profile", () => {
  assert.match(htmlSource, /id="openWalletButton"/);
  assert.match(htmlSource, /id="headerWalletBalance"/);
  assert.match(htmlSource, /id="mobileWalletButton"/);
  assert.match(htmlSource, /id="profileWalletTopupButton"/);
  assert.match(htmlSource, /id="walletTopupDialog"/);
  assert.match(scriptSource, /navigatePublicRoute\("\/profile\?wallet=topup"\)/);
  assert.match(scriptSource, /appRequest|adminRequest\("\/api\/profile\/wallet\/topups"/);
  assert.match(scriptSource, /pendingTopups/);
  assert.match(scriptSource, /if \(!walletLoadedAt\) \{\s*currentWallet = \{/);
  assert.match(stylesSource, /\.header-wallet-button/);
  assert.match(mobileStylesSource, /\.mobile-wallet-button/);
});
