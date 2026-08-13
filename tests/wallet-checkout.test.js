import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [migrationSql, serverSource, scriptSource, htmlSource, stylesSource] = await Promise.all([
  readFile(new URL("../migrations/024_wallets.sql", import.meta.url), "utf8"),
  readFile(new URL("../server.js", import.meta.url), "utf8"),
  readFile(new URL("../script.js", import.meta.url), "utf8"),
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../styles.css", import.meta.url), "utf8")
]);

test("wallet migration keeps balances, reservations, and ledger entries separate", () => {
  assert.match(migrationSql, /ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL\(12,2\) NOT NULL DEFAULT 0\.00/);
  assert.match(migrationSql, /CREATE TABLE IF NOT EXISTS wallet_reservations\b/);
  assert.match(migrationSql, /UNIQUE KEY uq_wallet_reservations_order \(order_id\)/);
  assert.match(migrationSql, /KEY idx_wallet_reservations_user_status \(user_id, status\)/);
  assert.match(migrationSql, /CREATE TABLE IF NOT EXISTS wallet_transactions\b/);
  assert.match(migrationSql, /UNIQUE KEY uq_wallet_transactions_idempotency \(idempotency_key\)/);
  assert.match(migrationSql, /ADD COLUMN IF NOT EXISTS wallet_amount/);
  assert.match(migrationSql, /ADD COLUMN IF NOT EXISTS external_amount/);
});

test("checkout calculates wallet use on the server under row locks", () => {
  assert.match(serverSource, /SELECT wallet_balance AS walletBalance FROM users WHERE id = \?\$\{lock \? " FOR UPDATE" : ""\}/);
  assert.match(serverSource, /FROM wallet_reservations[\s\S]{0,120}status = 'pending'/);
  assert.match(serverSource, /const walletAmount = Math\.min\(totalAmount, walletSnapshot\.availableBalance\)/);
  assert.match(serverSource, /const externalAmount = subtractMoney\(totalAmount, walletAmount\)/);
  assert.doesNotMatch(serverSource, /req\.body\.(walletAmount|externalAmount|walletBalance)/);
  assert.match(serverSource, /amount: order\.external_amount \?\? order\.total_amount/);
  assert.match(serverSource, /amount: \{ value: formatMoney\(amount\), currency \}/);
});

test("wallet capture is idempotent and follows external payment confirmation", () => {
  assert.match(serverSource, /async function captureWalletReservation/);
  assert.match(serverSource, /order:\$\{order\.id\}:wallet-capture/);
  assert.match(serverSource, /const expectedExternalAmount = toMoney\(order\.external_amount \|\| order\.total_amount\)/);
  assert.match(serverSource, /isSucceeded && paidAmount === expectedExternalAmount[\s\S]{0,220}captureWalletReservation\(connection, order\)/);
  assert.match(serverSource, /object\.status === "canceled"[\s\S]{0,180}releaseWalletReservation\(connection, order\.id\)/);
  assert.match(serverSource, /externalAmount === 0[\s\S]{0,500}captureWalletReservation\(connection, walletOrder\)/);
});

test("wallet APIs separate customer reads from administrative adjustments", () => {
  assert.match(serverSource, /app\.get\("\/api\/profile\/wallet", requireAuth/);
  assert.match(serverSource, /app\.put\("\/api\/admin\/users\/:id\/wallet", requireAuth, requireAdmin/);
  assert.match(serverSource, /Укажите причину изменения баланса/);
  assert.match(serverSource, /snapshot\.availableBalance < Math\.abs\(amount\)/);
});

test("profile and checkout clearly show balance and remaining payment", () => {
  assert.match(htmlSource, /id="profileWalletCard"/);
  assert.match(htmlSource, /id="profileWalletBalance"/);
  assert.match(scriptSource, /async function loadProfileWallet/);
  assert.match(scriptSource, /class="checkout-summary checkout-payment-breakdown"/);
  assert.match(scriptSource, />Из кошелька</);
  assert.match(scriptSource, /Доплатить \$\{moneyLabel\(amountToPay\)\}/);
  assert.match(scriptSource, /admin-wallet-controls/);
  assert.match(stylesSource, /\.profile-wallet-card \{/);
  assert.match(stylesSource, /\.checkout-payment-breakdown dl/);
});
