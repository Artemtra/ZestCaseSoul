import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [scriptSource, htmlSource, serverSource, mobileTestSource, mobileUiSource, mobileCssSource, stylesSource, deathNoteClock] = await Promise.all([
  readFile(new URL("../script.js", import.meta.url), "utf8"),
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../server.js", import.meta.url), "utf8"),
  readFile(new URL("../scripts/mobile-layout-check.js", import.meta.url), "utf8"),
  readFile(new URL("../mobile-ui.js", import.meta.url), "utf8"),
  readFile(new URL("../mobile.css", import.meta.url), "utf8"),
  readFile(new URL("../styles.css", import.meta.url), "utf8"),
  readFile(new URL("../assets/death-note-clock.png", import.meta.url))
]);

test("uploaded phone models render phone, design, then transformed camera mask", () => {
  const start = scriptSource.indexOf("function drawUploadedModelBase");
  const end = scriptSource.indexOf("function drawUploadedCameraMask", start);
  const body = scriptSource.slice(start, end);
  assert.ok(body.indexOf("ctx.drawImage(phoneImage") < body.indexOf("drawUserLayers(rect,"));
  assert.match(body, /drawUploadedCameraMask\(ctx, cameraOverlay, rect, currentModel\)/);
  assert.match(scriptSource, /function drawUploadedCameraMask[\s\S]*cameraOffsetX[\s\S]*cameraOffsetY[\s\S]*cameraScale/);
  assert.match(scriptSource, /drawUploadedCameraMask\(adminPreviewCtx, cameraPreview, rect, model\)/);
  assert.match(scriptSource, /render\(\{ showCamera: withCamera, showSelection: false \}\)/);
  assert.doesNotMatch(scriptSource, /__hideCameraOverlay|__caseSnapshotMode/);
});

test("model form uses one photo for both the phone and camera editor", () => {
  assert.match(htmlSource, /Фото модели[\s\S]*id="phoneImageInput"/);
  assert.match(htmlSource, /admin-file-field hidden[^>]*>[\s\S]{0,220}id="cameraImageInput"/);
  assert.match(scriptSource, /usePhoneImageForCamera = true;[\s\S]{0,120}openCameraMaskEditor\(adminPhoneImage\)/);
  assert.doesNotMatch(htmlSource, /usePhoneAsCameraButton/);
});

test("order routes have one active implementation each and use the orders tables", () => {
  const count = (pattern) => [...serverSource.matchAll(pattern)].length;
  assert.equal(count(/app\.put\("\/api\/admin\/orders\/:id\/status"/g), 1);
  assert.equal(count(/app\.post\("\/api\/executor\/orders\/:id\/photo"/g), 1);
  assert.equal(count(/app\.post\("\/api\/executor\/orders\/:id\/ship"/g), 1);
  assert.doesNotMatch(serverSource, /orders-legacy-disabled|executor\/orders-legacy-disabled/);
  assert.match(serverSource, /ready: new Set\(\["shipped", "cancelled"\]\)/);
});

test("public and administrative catalog access are separated without duplicate reads", () => {
  assert.match(serverSource, /app\.get\("\/api\/admin\/models", requireAuth, requireAdmin/);
  assert.match(serverSource, /app\.get\("\/api\/admin\/phone-model-categories", requireAuth, requireAdmin/);
  assert.match(serverSource, /app\.get\("\/api\/admin\/template-categories", requireAuth, requireAdmin/);
  assert.doesNotMatch(scriptSource, /include_empty=true/);
  assert.doesNotMatch(scriptSource, /adminRequest\("\/api\/models"/);
  assert.match(scriptSource, /adminRequest\("\/api\/admin\/models"/);
  assert.match(scriptSource, /let modelCatalogRequest = null/);
  assert.match(scriptSource, /function applyModelCatalogFilters\(\)/);
  assert.match(scriptSource, /async function fetchModelCatalog/);
  assert.match(scriptSource, /modelPickerModels = modelCatalog\.filter/);
  assert.match(scriptSource, /const adminTemplates = templateCatalog\.length \? templateCatalog : templates/);
});

test("public catalog reads use shared TTL cache and mutation invalidation", () => {
  assert.match(serverSource, /const publicDataCache = new Map\(\)/);
  assert.match(serverSource, /const publicDataRequests = new Map\(\)/);
  assert.match(serverSource, /async function getCachedPublicData/);
  assert.match(serverSource, /getCachedPublicData\("models", loadModelCatalog\)/);
  assert.match(serverSource, /getCachedPublicData\("templates", loadTemplateCatalog\)/);
  assert.match(serverSource, /getCachedPublicData\("stickers", loadStickerCatalog\)/);
  assert.match(serverSource, /invalidatePublicData\("models"/);
  assert.match(serverSource, /invalidatePublicData\("templates"/);
  assert.match(serverSource, /invalidatePublicData\("stickers", "sticker-categories"\)/);
});

test("categorized stickers are separate protected admin content and reusable image layers", () => {
  assert.match(serverSource, /app\.get\("\/api\/stickers"/);
  assert.match(serverSource, /app\.get\("\/api\/admin\/stickers", requireAuth, requireAdmin/);
  assert.match(serverSource, /app\.post\("\/api\/admin\/stickers", requireAuth, requireAdmin, upload\.single\("image"\)/);
  assert.match(serverSource, /app\.put\("\/api\/admin\/stickers\/:id", requireAuth, requireAdmin, upload\.single\("image"\)/);
  assert.match(serverSource, /app\.delete\("\/api\/admin\/stickers\/:id", requireAuth, requireAdmin/);
  assert.match(serverSource, /app\.get\("\/api\/admin\/sticker-categories", requireAuth, requireAdmin/);
  assert.match(serverSource, /\["image\/png", "image\/webp"\]/);
  assert.match(serverSource, /publicOnly && \(!row\.categoryId \|\| !row\.categoryIsActive\)/);

  assert.match(htmlSource, /id="stickerCategoryPicker"/);
  assert.match(htmlSource, /id="stickerList"/);
  assert.match(htmlSource, /data-editor-tool="stickers"/);
  assert.match(htmlSource, /id="adminStickerForm"[^>]*data-admin-editor="stickers"/);
  assert.match(htmlSource, /id="adminStickerCategoryForm"[^>]*data-admin-editor="stickerCategories"/);
  assert.match(scriptSource, /async function fetchStickerCatalog/);
  assert.match(scriptSource, /stickerCatalog\.filter/);
  assert.match(scriptSource, /addUserImageLayer\(stickerImage, null, sticker\.imageUrl, \{ scale: 0\.38, kind: "sticker" \}\)/);
  assert.match(htmlSource, /id="scaleInput" type="range" min="15" max="220"/);
  assert.match(scriptSource, /new CustomEvent\("case-editor:close-tool-editor"\)/);
  assert.match(mobileUiSource, /stickers: "Стикеры"/);
});

test("category and sticker order is assigned automatically without numeric admin fields", () => {
  assert.doesNotMatch(htmlSource, /name="sortOrder"/);
  assert.doesNotMatch(scriptSource, /form\.elements\.sortOrder/);
  assert.doesNotMatch(scriptSource, /formData\.get\("sortOrder"\)/);
  assert.match(serverSource, /SELECT COALESCE\(MAX\(sort_order\), 0\) \+ 1 AS nextSortOrder FROM \$\{tableName\}/);
  assert.match(serverSource, /UPDATE \$\{tableName\} SET name = \?, slug = \?, is_active = \? WHERE id = \?/);
  assert.match(serverSource, /async function nextStickerSortOrder\(categoryId\)/);
  assert.match(serverSource, /MAX\(sort_order\), 0\) \+ 1 AS nextSortOrder FROM stickers WHERE category_id <=> \?/);
});

test("admin navigation separates editors from category management", () => {
  assert.match(htmlSource, /class="admin-navigation panel"/);
  assert.match(htmlSource, /class="admin-nav-group admin-nav-group-editors"/);
  assert.match(htmlSource, /class="admin-nav-group admin-nav-group-categories"/);
  assert.match(htmlSource, /data-admin-target="models"/);
  assert.match(htmlSource, /data-admin-target="modelCategories"/);
  assert.match(htmlSource, /<optgroup label="Редакторы">/);
  assert.match(htmlSource, /<optgroup label="Категории">/);
  assert.doesNotMatch(htmlSource, /Какой редактор открыть/);
  assert.match(scriptSource, /const adminEditorNavButtons = document\.querySelectorAll\("\[data-admin-target\]"\)/);
  assert.match(scriptSource, /button\.classList\.toggle\("is-active", isActive\)/);
  assert.match(scriptSource, /showAdminEditor\(button\.dataset\.adminTarget\)/);
});

test("unsafe disabled payment route is removed", () => {
  assert.doesNotMatch(serverSource, /pay-legacy-disabled/);
  assert.doesNotMatch(serverSource, /SET payment_status = 'paid',[\s\S]{0,180}production_status = IF/);
});

test("CORS and uploads are restricted in production code", () => {
  assert.doesNotMatch(serverSource, /Access-Control-Allow-Origin", "\*"/);
  assert.match(serverSource, /corsOrigins/);
  assert.match(serverSource, /detectImageType/);
  assert.match(serverSource, /chunkType === "VP8X"/);
  assert.match(serverSource, /isSafeImageBuffer/);
  assert.doesNotMatch(serverSource, /dev-secret-change-me/);
  assert.match(serverSource, /AUTH_SECRET must be set/);
});

test("mobile layout check supports configurable cross-platform browsers", () => {
  assert.match(mobileTestSource, /process\.env\.CHROME_PATH/);
  assert.match(mobileTestSource, /platform\(\)/);
  assert.match(mobileTestSource, /Не найден Chrome\/Chromium/);
});

test("customer storefront shows model pricing and prevents unavailable orders", () => {
  assert.match(htmlSource, /id="modelPrice"/);
  assert.match(htmlSource, /id="modelProduction"/);
  assert.match(htmlSource, /id="modelMaterial"/);
  assert.match(htmlSource, /id="heroPrice"/);
  assert.match(scriptSource, /slug: row\.slug \|\| ""/);
  assert.match(scriptSource, /function updateModelSummary\(model\)/);
  assert.match(scriptSource, /saveProfileChoiceButton\.disabled = unavailable/);
  assert.match(scriptSource, /Эта модель временно недоступна для заказа/);
  assert.doesNotMatch(scriptSource, /срок может увеличиться примерно на 7 дней/);
});

test("case price defaults to 899 rubles across storefront, checkout, and new models", () => {
  assert.match(htmlSource, /Чехол со своим дизайном от 899 ₽/);
  assert.match(htmlSource, /id="heroPrice">от 899 ₽/);
  assert.match(htmlSource, /id="modelPrice">899 ₽/);
  assert.match(scriptSource, /const defaultCasePrice = 899;/);
  assert.match(scriptSource, /retailPrice: Number\(row\.retailPrice \?\? defaultCasePrice\)/);
  assert.match(scriptSource, /model\?\.retailPrice \?\? defaultCasePrice/);
  assert.match(serverSource, /const defaultCasePrice = 899;/);
  assert.match(serverSource, /slug, retail_price, camera_type/);
  assert.doesNotMatch(htmlSource, /1 990 ₽/);
  assert.doesNotMatch(scriptSource, /\b1990\b/);
});

test("checkout requires enough delivery data and continues to payment", () => {
  assert.match(scriptSource, /name="city"[^>]*required/);
  assert.match(scriptSource, /name="address"[^>]*required/);
  assert.match(scriptSource, /name="termsAccepted"[^>]*required/);
  assert.match(scriptSource, /name="privacyAccepted"[^>]*required/);
  assert.match(scriptSource, />Перейти к оплате</);
  assert.match(scriptSource, /const orderStarted = await payProfileDesigns\(\[savedDesign\]\)/);
  assert.match(serverSource, /!recipientEmail \|\| !city \|\| !address/);
  assert.match(serverSource, /Введите имя, телефон, email, город и адрес доставки/);
  assert.match(serverSource, /!termsAccepted \|\| !privacyAccepted/);
  assert.match(serverSource, /Подтвердите согласие с офертой и обработкой персональных данных/);
});

test("profile provides an authenticated order list with status filters", () => {
  assert.match(htmlSource, /id="profileOrdersToggleButton"/);
  assert.match(htmlSource, /id="profileOrdersPanel"/);
  assert.match(htmlSource, /data-profile-order-filter="new"/);
  assert.match(scriptSource, /fetch\(apiUrl\("\/api\/profile\/orders"\)/);
  assert.match(scriptSource, /function renderProfileOrders\(\)/);
  assert.match(serverSource, /app\.get\("\/api\/profile\/orders", requireAuth/);
});

test("constructor, templates, and API enforce a ten-image limit", () => {
  assert.match(scriptSource, /const maxImageLayers = 10/);
  assert.match(scriptSource, /function canAddImageLayers/);
  assert.match(scriptSource, /const templateImageCount = templateLayers\.filter/);
  assert.match(scriptSource, /maxImageLayers - imageLayerCount\(\)/);
  assert.match(serverSource, /const maxDesignImages = 10/);
  assert.match(serverSource, /imageLayerCount > maxDesignImages/);
});

test("switching ready templates replaces image layers and preserves existing text", () => {
  assert.match(scriptSource, /async function applyTemplate\(template, \{ replace = false, replaceImages = false \} = \{\}\)/);
  assert.match(scriptSource, /const preservedTextLayers = replaceImages && !replace \? userLayers\.filter\(isTextLayer\) : \[\]/);
  assert.match(scriptSource, /replaceImages\s*\? \[\.\.\.preservedTextLayers, \.\.\.preparedLayers\]/);
  assert.match(scriptSource, /await applyTemplate\(template, \{ replaceImages: true \}\)/);
  assert.match(scriptSource, /requestId !== templateApplyRequestId/);
  assert.match(mobileTestSource, /choosing a template did not replace the existing photo and sticker/);
  assert.match(mobileTestSource, /switching templates did not preserve the text layers/);
});

test("Death Note template plays a short lazy pocket-watch effect", () => {
  assert.match(htmlSource, /id="deathNoteWatchEffect"[^>]*hidden/);
  assert.match(htmlSource, /id="deathNoteWatchImage" data-src="\/assets\/death-note-clock\.png"/);
  assert.doesNotMatch(htmlSource, /id="deathNoteWatchImage"[^>]*\ssrc=/);
  assert.match(scriptSource, /normalizedTemplateTitle\(template\) === "тетрадь смерти"/);
  assert.match(scriptSource, /const applied = await applyTemplate\(template, \{ replaceImages: true \}\);\s*if \(applied\) handleTemplateSelectionEffect\(template\);/);
  assert.match(stylesSource, /\.death-note-watch-effect \{[\s\S]*?pointer-events: none;/);
  assert.match(stylesSource, /@keyframes death-note-watch-swing/);
  assert.match(stylesSource, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(mobileTestSource, /ordinary template triggered the Death Note watch effect/);
  assert.ok(deathNoteClock.length > 100_000);
});

test("text layers stay above images and are limited to seven", () => {
  assert.match(scriptSource, /const maxTextLayers = 7/);
  assert.match(scriptSource, /function orderedLayersForRendering/);
  assert.match(scriptSource, /\.\.\.layers\.filter\(\(layer\) => !isTextLayer\(layer\)\),[\s\S]*\.\.\.layers\.filter\(\(layer\) => isTextLayer\(layer\)\)/);
  assert.match(scriptSource, /function updateSelectedTextLayer/);
  assert.match(scriptSource, /function setSelectedDesignLayer[\s\S]*?reason: "layer-deselected"/);
  assert.match(scriptSource, /if \(userLayers\.length === 0 \|\| !isInsideCase\(point\)\) \{\s*setSelectedDesignLayer\(null\)/);
  assert.match(scriptSource, /if \(!layer\) \{\s*setSelectedDesignLayer\(null\)/);
  assert.match(scriptSource, /orderedLayersForRendering\(\)/);
  assert.match(scriptSource, /updateSelectedText: updateSelectedTextLayer/);
  assert.match(scriptSource, /new CustomEvent\("case-editor:text-selected"\)/);
  assert.match(serverSource, /const maxDesignTexts = 7/);
});

test("selecting an image opens a complete responsive layer editor", () => {
  assert.match(htmlSource, /id="imageLayerEditor"[^>]*aria-label="Редактирование выбранного изображения"/);
  assert.match(htmlSource, /id="imageLayerKind"/);
  assert.match(htmlSource, /id="scaleInput"[\s\S]*id="rotateInput"[\s\S]*id="sendBackwardButton"[\s\S]*id="bringForwardButton"[\s\S]*id="deleteSelectedImageButton"/);
  assert.match(htmlSource, /id="rotateInput" type="range" min="-180" max="180" value="0"/);
  assert.match(scriptSource, /new CustomEvent\("case-editor:image-selected"/);
  assert.match(scriptSource, /selectedImage: \(\) =>/);
  assert.match(scriptSource, /kind: "sticker"/);
  assert.match(scriptSource, /kind: "template"/);
  assert.match(mobileUiSource, /window\.addEventListener\("case-editor:image-selected", \(\) => \{\s*openToolSheet\("image"\)/);
  assert.match(mobileUiSource, /rememberAndMove\(imageLayerEditor\)/);
  assert.match(mobileCssSource, /\.mobile-tool-sheet-content \.image-layer-editor \{\s*display: grid/);
  assert.match(mobileTestSource, /adding a photo did not immediately open the full image editor/);
  assert.match(mobileTestSource, /selecting a template did not open the full right image editor/);
});

test("new photos and stickers immediately open their selected-layer editor", () => {
  assert.match(scriptSource, /function openEditorForLayer\(layer = selectedLayer\(\)\)/);
  assert.match(scriptSource, /if \(openEditor\) openEditorForLayer\(layer\);/);
  assert.match(scriptSource, /addUserImageLayer\(stickerImage, null, sticker\.imageUrl, \{ scale: 0\.38, kind: "sticker" \}\);/);
  assert.doesNotMatch(scriptSource, /addUserImageLayer\(stickerImage[\s\S]{0,180}case-editor:close-tool-editor/);
  assert.match(scriptSource, /addUserImageLayer\(image, null, sourceUrl, \{ openEditor: index === files\.length - 1 \}\)/);
  assert.match(mobileTestSource, /adding a sticker did not immediately open its layer editor/);
  assert.match(mobileTestSource, /adding a photo did not immediately open the full image editor/);
});

test("adding text in the admin template builder does not submit the template form", () => {
  assert.match(scriptSource, /adminTemplateForm\.addEventListener\("submit", async \(event\) => \{\s*\/\/ The text editor[\s\S]*?if \(event\.target !== adminTemplateForm\) return;/);
  assert.match(mobileUiSource, /form\.addEventListener\("submit", async \(event\) => \{\s*event\.preventDefault\(\);\s*\/\/ In the admin template builder[\s\S]*?event\.stopPropagation\(\);/);
  assert.match(scriptSource, /designStatePayload\(\{ includeModel: false, relativeLayers: true \}\)/);
  assert.match(scriptSource, /dataUrlToFile\(caseSnapshotDataUrl\(\{ withCamera: true \}\), "template-preview\.png"\)/);
  assert.match(mobileUiSource, /const isTemplateBuilder = document\.querySelector\("#clientWorkspace"\)\?\.classList\.contains\("template-builder-workspace"\)/);
  assert.match(mobileUiSource, /sheet\.classList\.toggle\("is-template-builder", Boolean\(isTemplateBuilder\)\)/);
  assert.match(mobileUiSource, /document\.body\.classList\.toggle\("template-tool-drawer-open", Boolean\(isTemplateBuilder\)\)/);
  assert.match(mobileUiSource, /adminTemplateTextDrawerMount\.append\(sheet\)/);
  assert.match(mobileUiSource, /sheet\.dataset\.context = "admin-template-builder"/);
  assert.match(mobileUiSource, /saveText\(\{ \.\.\.readTextOptions\(\), createNew: forceNewText \}\)/);
  assert.match(scriptSource, /const existing = options\.createNew \? null : selectedLayer\(\)/);
  assert.match(htmlSource, /<div class="admin-template-builder" id="adminTemplateBuilderMount"><\/div>/);
  assert.match(htmlSource, /id="adminTemplateAddTextButton" type="button"/);
  assert.match(htmlSource, /id="adminTemplateTextDrawerMount"/);
  assert.match(htmlSource, /id="mobileToolSheet" role="dialog" aria-modal="false"/);
  assert.match(htmlSource, /<\/footer>\s*<\/section>\s*<section class="mobile-tool-sheet" id="mobileToolSheet"/);
  assert.match(scriptSource, /new CustomEvent\("case-editor:open-text-editor", \{ detail: \{ forceNewText: true \} \}\)/);
  assert.match(scriptSource, /clientWorkspace\?\.classList\.contains\("template-builder-workspace"\)/);
  assert.match(mobileUiSource, /window\.addEventListener\("case-editor:open-text-editor", \(event\) => \{\s*openToolSheet\("text", \{ forceNewText: Boolean\(event\.detail\?\.forceNewText\) \}\);/);
  assert.doesNotMatch(mobileCssSource, /template-tool-drawer-open #adminTemplateForm[\s\S]*?padding-right/);
});

test("model editor exposes a persisted corner-radius slider", () => {
  assert.match(htmlSource, /id="modelCornerRadiusInput" name="cornerRadius" type="range" min="0" max="120"/);
  assert.match(scriptSource, /modelCornerRadiusOutput\.textContent = `\$\{modelCornerRadiusInput\?\.value \|\| 0\} px`/);
});

test("model editor persists the adjustable light frame width", () => {
  assert.match(htmlSource, /id="modelFrameWidthInput" name="frameWidth" type="range" min="0" max="18"/);
  assert.match(scriptSource, /frameWidth: Number\(row\.frameWidth \?\? row\.frame_width \?\? 18\)/);
  assert.match(serverSource, /pm\.frame_width AS frameWidth/);
  assert.match(serverSource, /frameWidth > 18/);
});

test("camera mask tool stamps a persisted protection mark from a movable guide circle", () => {
  assert.match(htmlSource, /id="cutRingButton"[^>]*>🛡<\/button>/);
  assert.match(scriptSource, /let protectionStrokes = \[\]/);
  assert.match(scriptSource, /let protectionGuide = \{ x: 120, y: 120, radius: 42 \}/);
  assert.match(scriptSource, /function stampProtectionGuide\(\)/);
  assert.match(scriptSource, /function protectionGuideDragAction\(point\)/);
  assert.match(scriptSource, /protectionMaskCtx\.getImageData/);
  assert.match(scriptSource, /gapHighlightVisible && protectionStrokes\.length > 0/);
  assert.match(scriptSource, /fillStyle = "rgba\(37, 137, 214, 0\.42\)"/);
  assert.doesNotMatch(scriptSource, /function toggleProtectionBrush\(/);
});
