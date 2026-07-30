import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [html, client, server, styles, migration] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../script.js", import.meta.url), "utf8"),
  readFile(new URL("../server.js", import.meta.url), "utf8"),
  readFile(new URL("../styles.css", import.meta.url), "utf8"),
  readFile(new URL("../migrations/023_support_chat.sql", import.meta.url), "utf8")
]);

test("the cat opens an accessible cartoon support chat with clear empty-state copy", () => {
  assert.match(html, /id="cornerCatCallout">Нажми на меня!<\/span>/);
  assert.match(html, /id="openSupportChatButton"[^>]*aria-label="Открыть чат с администратором"/);
  assert.match(html, /id="supportChatDialog"[^>]*aria-labelledby="supportChatTitle"/);
  assert.match(html, /<h2>Чат с администратором<\/h2>/);
  assert.match(html, /<p>Задайте интересующий вас вопрос<\/p>/);
  assert.match(html, /id="supportChatInput" maxlength="2000"/);
  assert.match(styles, /\.corner-cat-callout::after/);
  assert.match(styles, /font-family: "Manrope", sans-serif;/);
  assert.match(styles, /font-weight: 800;/);
  assert.match(client, /if \(cornerCatCallout\) cornerCatCallout\.hidden = true;/);
  assert.match(client, /openSupportChatButton\?\.removeAttribute\("aria-describedby"\)/);
  assert.match(styles, /\.corner-cat-callout\[hidden\]/);
  assert.match(styles, /\.corner-cat\.is-returned-focus:focus-visible \{[\s\S]*?outline: none;[\s\S]*?box-shadow: none;/);
  assert.match(client, /supportChatDialog\?\.addEventListener\("cancel",[\s\S]*?openSupportChatButton\?\.classList\.add\("is-returned-focus"\)/);
  assert.match(client, /supportChatDialog\?\.addEventListener\("close",[\s\S]*?openSupportChatButton\?\.classList\.add\("is-returned-focus"\)/);
  assert.match(client, /openSupportChatButton\?\.addEventListener\("blur",[\s\S]*?classList\.remove\("is-returned-focus"\)/);
  assert.match(styles, /@keyframes corner-cat-callout-arrive/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("support chat polls only while its visible interface is open", () => {
  assert.match(client, /if \(supportChatDialog\?\.open && document\.visibilityState === "visible"\)/);
  assert.match(client, /\}, 15_000\);/);
  assert.match(client, /function stopSupportPolling\(\)/);
  assert.match(client, /supportChatDialog\?\.addEventListener\("close"/);
  assert.match(client, /"X-Chat-Token": supportGuestToken\(\)/);
  assert.match(client, /window\.crypto\.getRandomValues\(bytes\)/);
});

test("admin navigation has a separate protected messages workspace", () => {
  assert.match(html, /data-admin-target="messages"[\s\S]{0,160}<strong>Сообщения<\/strong>/);
  assert.match(html, /data-admin-editor="messages"[^>]*aria-labelledby="adminSupportTitle"/);
  assert.match(html, /id="adminSupportConversations"/);
  assert.match(html, /id="adminSupportForm"/);
  assert.match(client, /if \(editorName === "messages"\)/);
  assert.match(client, /loadAdminSupportConversations/);
  assert.match(server, /app\.get\("\/api\/admin\/support\/conversations", requireAuth, requireAdmin/);
  assert.match(server, /app\.get\("\/api\/admin\/support\/conversations\/:id\/messages", requireAuth, requireAdmin/);
  assert.match(server, /app\.post\("\/api\/admin\/support\/conversations\/:id\/messages", requireAuth, requireAdmin/);
});

test("support messages are bounded, token-scoped, incremental, and persisted with indexes", () => {
  assert.match(server, /const maxSupportMessageLength = 2000/);
  assert.match(server, /\^\[a-f0-9\]\{48\}\$/);
  assert.match(server, /createHash\("sha256"\)/);
  assert.match(server, /WHERE conversation_id = \? AND id > \?/);
  assert.match(server, /supportPostAllowed/);
  assert.match(server, /Access-Control-Allow-Headers", "Content-Type, Authorization, X-Chat-Token"/);
  assert.match(server, /findSupportConversation\(req, \{ create: true \}\)/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS support_conversations/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS support_messages/);
  assert.match(migration, /FOREIGN KEY \(conversation_id\) REFERENCES support_conversations\(id\)/);
  assert.match(migration, /KEY idx_support_messages_conversation_id \(conversation_id, id\)/);
});
