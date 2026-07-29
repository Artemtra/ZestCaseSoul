import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(process.cwd());
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
const client = fs.readFileSync(path.join(root, "script.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");

test("server uses safe registries for public paths", () => {
  assert.match(server, /const projectPaths = Object\.freeze/);
  assert.match(server, /const apiPrefix = "\/api"/);
  assert.match(server, /const publicFiles = Object\.freeze/);
  assert.match(server, /const publicApplicationRoutes = Object\.freeze/);
  assert.match(server, /const publicRedirects = Object\.freeze/);
  assert.match(server, /express\.static\(projectPaths\.uploads/);
  assert.match(server, /express\.static\(projectPaths\.assets/);
  assert.match(server, /route: "\/error\.html"/);
  assert.doesNotMatch(server, /app\._router\.handle/);

  for (const route of ["/constructor", "/templates", "/models", "/how-it-works", "/faq", "/about", "/contacts", "/delivery", "/returns", "/payment", "/offer", "/privacy", "/login", "/profile", "/orders"]) {
    assert.match(server, new RegExp(`path: "${route}"`));
  }

  assert.match(server, /"\/editor": "\/constructor"/);
  assert.match(server, /app\.get\("\/products\/:slug", \(req, res\) =>/);
  assert.doesNotMatch(server, /SELECT id FROM phone_models WHERE slug = \? LIMIT 1/);
});

test("lightweight public infrastructure routes are present", () => {
  assert.match(server, /app\.get\("\/healthz", sendHealth\)/);
  assert.match(server, /app\.get\(`\$\{apiPrefix\}\/health`, sendHealth\)/);
  assert.match(server, /app\.get\(`\$\{apiPrefix\}\/public\/routes`/);
  assert.match(server, /app\.get\(`\$\{apiPrefix\}\/public\/config`/);
  assert.match(server, /function setPublicCache\(res, seconds = 60\)/);
  assert.match(server, /app\.use\(apiPrefix, \(_req, res\) =>/);
  assert.match(server, /sendProjectFile\(res, "error\.html", \{ cache: "no-store" \}\)/);
});

test("browser navigation uses the History API without page reloads", () => {
  assert.match(client, /function appUrl\(value\)/);
  assert.match(client, /function apiUrl\(path\)/);
  assert.match(client, /function displayImageUrl\(src\)/);
  assert.match(client, /fetch\(apiUrl\(path\)/);
  assert.match(client, /const publicRouteDefinitions = Object\.freeze/);
  assert.match(client, /function currentPublicRoute\(\)/);
  assert.match(client, /function applyPublicRoute\(/);
  assert.match(client, /function navigatePublicRoute\(path/);
  assert.match(client, /window\.addEventListener\("popstate"/);
  assert.match(client, /window\.caseEditorRouter = Object\.freeze/);
  assert.match(client, /const profileModalRoutePaths = new Set\(\["\/profile", "\/designs", "\/orders"\]\)/);
  assert.match(client, /zcsProfileModalEntry: !replace/);
  assert.match(client, /zcsProfileReturnUrl:/);
  assert.match(client, /profileDialog\?\.addEventListener\("close", syncRouteAfterProfileClose\)/);
  assert.match(client, /if \(!profileModalRoutePaths\.has\(pathname\)\) closeProfileDialogForRouteChange\(\)/);
  assert.match(index, /href="\/styles\.css\?v=/);
  assert.match(index, /src="\/script\.js\?v=/);
  assert.match(index, /href="\/how-it-works" data-route/);
  assert.match(index, /href="\/delivery" data-route/);
  assert.match(index, /href="\/payment" data-route/);
  assert.match(index, /href="\/offer" data-route/);
  assert.match(index, /href="\/privacy" data-route/);
  assert.doesNotMatch(index, /href="#(?:constructor|howItWorks|faq)"/);
  assert.match(fs.readFileSync(path.join(root, "scripts", "mobile-layout-check.js"), "utf8"), /closing the dialog did not return to the previous public route/);
});

test("indexable public routes are included in the sitemap", () => {
  for (const route of ["constructor", "templates", "models", "how-it-works", "faq", "about", "contacts", "delivery", "returns", "payment", "offer", "privacy"]) {
    assert.match(sitemap, new RegExp(`<loc>https://zestcasesoul\\.ru/${route}</loc>`));
  }
});

test("legal pages expose seller details and required documents", () => {
  assert.match(index, /Рейле Артем Алексович/);
  assert.match(index, /ИНН 253607766198/);
  assert.match(index, /mailto:moonstar\.artemreile@gmail\.com/);
  const footer = index.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)?.[0] || "";
  assert.doesNotMatch(footer, /Рейле Артем Алексович/);
  for (const route of ["/contacts", "/delivery", "/returns", "/payment", "/offer", "/privacy"]) {
    assert.match(client, new RegExp(`"${route.replace("/", "\\/")}"`));
    assert.match(index, new RegExp(`data-legal-page="${route.replace("/", "\\/")}"`));
  }
  assert.match(index, /id="authConsent"[^>]*required/);
  assert.match(index, /Редакция от 29 июля 2026 года/);
  assert.match(index, /Данные оплаченного заказа считаются утверждёнными Покупателем/);
  assert.match(index, /Время ожидания ответа не включается в срок изготовления/);
  assert.match(index, /К заказу применяется редакция оферты, которую Покупатель принял/);
  assert.match(client, /legalVersion: "2026-07-29"/);
  assert.match(server, /legalDocumentVersion = "2026-07-29"/);
});
