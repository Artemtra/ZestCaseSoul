import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationSql = readFileSync(new URL("../migrations/016_orders_cart_payments_audit.sql", import.meta.url), "utf8");

test("orders migration creates order and payment safety tables", () => {
  for (const table of ["orders", "order_items", "order_status_history", "payment_events", "admin_audit_log"]) {
    assert.match(migrationSql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`));
  }
});

test("payment webhook events are idempotent", () => {
  assert.match(migrationSql, /UNIQUE KEY uq_payment_events_provider_event \(provider, external_event_id\)/);
});

test("orders snapshot design and pricing data", () => {
  for (const column of ["phone_model_name", "unit_price", "total_price", "source_file_url", "preview_file_url", "print_file_url"]) {
    assert.match(migrationSql, new RegExp(`\\b${column}\\b`));
  }
});
