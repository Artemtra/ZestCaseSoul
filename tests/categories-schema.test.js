import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationSql = readFileSync(new URL("../migrations/017_categories_and_template_data.sql", import.meta.url), "utf8");
const stickerMigrationSql = readFileSync(new URL("../migrations/021_stickers.sql", import.meta.url), "utf8");
const starterStickerMigrationSql = readFileSync(new URL("../migrations/022_seed_starter_sticker.sql", import.meta.url), "utf8");

test("categories migration creates phone and template categories", () => {
  assert.match(migrationSql, /CREATE TABLE IF NOT EXISTS phone_model_categories/);
  assert.match(migrationSql, /CREATE TABLE IF NOT EXISTS design_template_categories/);
});

test("categories migration attaches categories to existing entities", () => {
  assert.match(migrationSql, /ALTER TABLE phone_models[\s\S]*category_id/);
  assert.match(migrationSql, /ALTER TABLE case_templates[\s\S]*category_id/);
});

test("template migration stores editable template structure", () => {
  assert.match(migrationSql, /\btemplate_data JSON NULL\b/);
  assert.match(migrationSql, /\bpreview_url VARCHAR\(500\) NULL\b/);
});

test("stickers migration creates categorized transparent-image catalog", () => {
  assert.match(stickerMigrationSql, /CREATE TABLE IF NOT EXISTS sticker_categories/);
  assert.match(stickerMigrationSql, /CREATE TABLE IF NOT EXISTS stickers/);
  assert.match(stickerMigrationSql, /FOREIGN KEY \(category_id\) REFERENCES sticker_categories\(id\)/);
  assert.match(stickerMigrationSql, /idx_stickers_category_active/);
});

test("starter sticker migration reuses the transparent brand asset without duplicates", () => {
  assert.match(starterStickerMigrationSql, /zestcasesoul-social-transparent\.png/);
  assert.match(starterStickerMigrationSql, /sc\.slug = 'symbols'/);
  assert.match(starterStickerMigrationSql, /NOT EXISTS/);
});
