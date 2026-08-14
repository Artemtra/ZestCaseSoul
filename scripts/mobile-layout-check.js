import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { platform } from "node:os";
import { chromium } from "playwright-core";

const root = normalize(join(import.meta.dirname, ".."));
function findBrowserPath() {
  const fromEnvironment = process.env.CHROME_PATH?.trim();
  if (fromEnvironment && existsSync(fromEnvironment)) return fromEnvironment;
  const system = platform();
  const candidates = system === "win32"
    ? [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
    ]
    : system === "darwin"
      ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium"]
      : ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
  return candidates.find((candidate) => candidate && existsSync(candidate)) || null;
}

const chromePath = findBrowserPath();
if (!chromePath) {
  throw new Error("Не найден Chrome/Chromium. Укажите путь через переменную окружения CHROME_PATH.");
}
const viewports = [
  [320, 568],
  [360, 800],
  [375, 667],
  [390, 844],
  [412, 915],
  [430, 932],
  [768, 1024],
  [1366, 900]
];
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".json": "application/json; charset=utf-8"
};
const applicationRoutes = new Set([
  "/constructor",
  "/templates",
  "/models",
  "/how-it-works",
  "/faq",
  "/about",
  "/delivery",
  "/payment",
  "/login",
  "/register",
  "/profile",
  "/designs",
  "/orders"
]);

const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, "http://127.0.0.1").pathname;
    const publicApiFixtures = {
      "/api/public/config": {
        purchasesEnabled: true,
        purchasesDisabledMessage: "Приём заказов временно приостановлен. Вы можете создать и сохранить дизайн — оформить покупку можно будет немного позже."
      },
      "/api/phone-model-categories": [],
      "/api/template-categories": [{ id: 1, name: "Тестовые макеты", slug: "testovye-makety", sortOrder: 1, itemsCount: 3 }],
      "/api/templates": [
        { id: 1, title: "Оранжевый макет", categoryId: 1, imageUrl: "/assets/templates/orange-wave.svg", previewUrl: "/assets/templates/orange-wave.svg" },
        { id: 2, title: "Мятный макет", categoryId: 1, imageUrl: "/assets/templates/mint-wave.svg", previewUrl: "/assets/templates/mint-wave.svg" },
        { id: 3, title: "Тетрадь смерти", categoryId: 1, imageUrl: "/assets/templates/cosmic.svg", previewUrl: "/assets/templates/cosmic.svg" }
      ],
      "/api/sticker-categories": [{ id: 1, name: "Символы", slug: "simvoly", sortOrder: 10, itemsCount: 1 }],
      "/api/stickers": [{ id: 1, title: "ZCS", categoryId: 1, categoryName: "Символы", categorySlug: "simvoly", imageUrl: "/assets/zestcasesoul-social-transparent.png", sortOrder: 10 }]
    };
    if (Object.hasOwn(publicApiFixtures, pathname)) {
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify(publicApiFixtures[pathname]));
      return;
    }
    if (pathname.startsWith("/api/")) {
      response.writeHead(404, { "content-type": "application/json" });
      response.end("{}");
      return;
    }
    const isApplicationRoute = pathname === "/" || applicationRoutes.has(pathname) || /^\/products\/[a-z0-9-]+$/i.test(pathname);
    const relativePath = isApplicationRoute ? "index.html" : decodeURIComponent(pathname.slice(1));
    const filePath = normalize(join(root, relativePath));
    if (!filePath.startsWith(root)) throw new Error("Invalid path");
    const content = await readFile(filePath);
    response.writeHead(200, { "content-type": mimeTypes[extname(filePath)] || "application/octet-stream" });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

const externalUrl = process.env.MOBILE_TEST_URL?.replace(/\/$/, "");
if (!externalUrl) await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const baseUrl = externalUrl || `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const failures = [];
const screenshotDir = process.env.UI_SCREENSHOT_DIR?.trim();
if (screenshotDir) await mkdir(screenshotDir, { recursive: true });

try {
  const directRoutePage = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const directRouteErrors = [];
  directRoutePage.on("pageerror", (error) => directRouteErrors.push(error.message));
  const directRoutes = [
    ["/constructor", "Онлайн-конструктор", "#constructor"],
    ["/templates", "Готовые макеты", ".templates-box"],
    ["/how-it-works", "Как создать чехол", "#howItWorks"],
    ["/faq", "Вопросы о персональных чехлах", "#faq"],
    ["/about", "О ZestCaseSoul", "#aboutInfo"],
    ["/delivery", "Доставка заказов", "#deliveryInfo"],
    ["/payment", "Оплата заказа", "#paymentInfo"]
  ];
  for (const [route, title, target] of directRoutes) {
    directRouteErrors.length = 0;
    await directRoutePage.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    await directRoutePage.waitForFunction((expected) => document.title.includes(expected), title);
    await directRoutePage.waitForTimeout(80);
    const routeState = await directRoutePage.evaluate((selector) => ({
      pathname: window.location.pathname,
      canonical: document.querySelector('link[rel="canonical"]')?.href || "",
      targetExists: Boolean(document.querySelector(selector))
    }), target);
    if (routeState.pathname !== route || !routeState.canonical.endsWith(route) || !routeState.targetExists) {
      failures.push(`${route}: direct route did not resolve to its page target`);
    }
    if (directRouteErrors.length) failures.push(`${route}: ${directRouteErrors.join("; ")}`);
  }

  await directRoutePage.goto(`${baseUrl}/constructor`, { waitUntil: "networkidle" });
  await directRoutePage.evaluate(() => window.caseEditorRouter.navigate("/profile"));
  await directRoutePage.waitForTimeout(320);
  await directRoutePage.evaluate(() => {
    const authDialog = document.querySelector("#authDialog");
    if (authDialog?.open) authDialog.close();
    const profileDialog = document.querySelector("#profileDialog");
    if (profileDialog && !profileDialog.open) profileDialog.showModal();
  });
  await directRoutePage.locator("#closeProfileButton").click();
  await directRoutePage.waitForFunction(() => window.location.pathname === "/constructor");
  const profileCloseReturnState = await directRoutePage.evaluate(() => ({
    pathname: window.location.pathname,
    profileOpen: document.querySelector("#profileDialog")?.open
  }));
  if (profileCloseReturnState.pathname !== "/constructor" || profileCloseReturnState.profileOpen) {
    failures.push("profile route: closing the dialog did not return to the previous public route");
  }

  await directRoutePage.goto(`${baseUrl}/profile`, { waitUntil: "networkidle" });
  await directRoutePage.waitForTimeout(320);
  await directRoutePage.evaluate(() => {
    const authDialog = document.querySelector("#authDialog");
    if (authDialog?.open) authDialog.close();
    const profileDialog = document.querySelector("#profileDialog");
    if (profileDialog && !profileDialog.open) profileDialog.showModal();
  });
  await directRoutePage.locator("#closeProfileButton").click();
  await directRoutePage.waitForFunction(() => window.location.pathname === "/");
  if (await directRoutePage.locator("#profileDialog").evaluate((dialog) => dialog.open)) {
    failures.push("profile route: directly opened profile stayed open after returning to the homepage");
  }
  await directRoutePage.close();

  for (const [width, height] of viewports) {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: width <= 860, hasTouch: width <= 860 });
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(150);

    const layout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      canvas: document.querySelector("#caseCanvas")?.getBoundingClientRect().toJSON(),
      preview: document.querySelector("#clientWorkspace .preview-wrap")?.getBoundingClientRect().toJSON(),
      menuButton: document.querySelector("#mobileMenuButton")?.getBoundingClientRect().toJSON()
    }));
    if (layout.scrollWidth > layout.viewportWidth + 1) {
      failures.push(`${width}x${height}: horizontal overflow ${layout.scrollWidth}px > ${layout.viewportWidth}px`);
    }
    if (!layout.canvas || layout.canvas.width < 180 || layout.canvas.right > width + 1) {
      failures.push(`${width}x${height}: canvas is outside the viewport or too small`);
    }
    if (width <= 860 && layout.preview && layout.canvas && (layout.canvas.top < layout.preview.top - 1 || layout.canvas.bottom > layout.preview.bottom + 1)) {
      failures.push(`${width}x${height}: phone canvas is clipped by its preview container`);
    }

    if (width <= 860) {
      if (!layout.menuButton || layout.menuButton.width < 44 || layout.menuButton.height < 44) {
        failures.push(`${width}x${height}: menu tap target is smaller than 44px`);
      }
      await page.locator("#mobileMenuButton").click();
      if (await page.locator("#mobileMenu").getAttribute("aria-hidden") !== "false") {
        failures.push(`${width}x${height}: mobile menu did not open`);
      }
      const menuText = await page.locator("#mobileMenu").textContent();
      if (/Корзина|Готовые макеты|Вход или профиль/.test(menuText)) {
        failures.push(`${width}x${height}: removed mobile menu items are still present`);
      }
      if (!menuText.includes("Войти")) failures.push(`${width}x${height}: guest menu has no login item`);
      await page.evaluate(() => {
        const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
        window.dispatchEvent(event);
      });
      try {
        await page.waitForFunction(() => document.querySelector("#mobileMenu")?.getAttribute("aria-hidden") === "true", null, { timeout: 1000 });
      } catch {
        failures.push(`${width}x${height}: Escape did not close the mobile menu`);
        await page.locator("#mobileMenuClose").evaluate((button) => button.click());
      }
      await page.waitForTimeout(250);
      await page.locator("#openLoginButton").evaluate((button) => button.click());
      const dialogFits = await page.locator("#authDialog").evaluate((dialog) => {
        const rect = dialog.getBoundingClientRect();
        return rect.left >= 0 && rect.right <= window.innerWidth && rect.top >= 0 && rect.bottom <= window.innerHeight;
      });
      if (!dialogFits) failures.push(`${width}x${height}: auth dialog does not fit`);
      await page.locator("#closeAuthButton").click();

      await page.locator("#caseCanvas").scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.body.classList.contains("editor-toolbar-visible"));
      await page.locator('[data-editor-tool="templates"]').click();
      if (await page.locator("#mobileToolSheet").getAttribute("aria-hidden") !== "false") {
        failures.push(`${width}x${height}: tool sheet did not open`);
      }
      await page.waitForTimeout(250);
      const toolSheetVisible = await page.locator("#mobileToolSheet").evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return rect.height > 80 && rect.top < window.innerHeight && rect.bottom <= window.innerHeight + 1;
      });
      if (!toolSheetVisible) failures.push(`${width}x${height}: tool sheet is outside the visible viewport`);
      await page.locator("#mobileToolSheetClose").click();
      await page.waitForTimeout(250);

      await page.locator('[data-editor-tool="stickers"]').click();
      await page.waitForFunction(() => document.querySelectorAll("#stickerList .sticker-card").length > 0);
      await page.waitForTimeout(250);
      if (await page.locator("#mobileToolSheet").getAttribute("aria-hidden") !== "false") {
        failures.push(`${width}x${height}: sticker tool sheet did not open`);
      }
      const stickerSheetVisible = await page.locator("#mobileToolSheet").evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return rect.height > 80 && rect.top < window.innerHeight && rect.bottom <= window.innerHeight + 1;
      });
      if (!stickerSheetVisible) failures.push(`${width}x${height}: sticker tool sheet is outside the visible viewport`);
      if (width === 390 || width === 1366) {
        if (screenshotDir && width === 390) await page.screenshot({ path: join(screenshotDir, "stickers-mobile-390.png"), fullPage: false });
        const layersBeforeSticker = await page.evaluate(() => window.caseEditorTools.designState().layers.length);
        await page.locator("#stickerList .sticker-card").first().click();
        await page.waitForTimeout(600);
        const stickerState = await page.evaluate(() => ({
          layers: window.caseEditorTools.designState().layers.length,
          sourceUrl: window.caseEditorTools.designState().layers.at(-1)?.sourceUrl || "",
          kind: document.querySelector("#imageLayerKind")?.textContent,
          editorMounted: document.querySelector("#mobileToolSheetContent #imageLayerEditor") !== null,
          sheetHidden: document.querySelector("#mobileToolSheet")?.getAttribute("aria-hidden"),
          sheetTool: document.querySelector("#mobileToolSheet")?.dataset.tool || ""
        }));
        if (stickerState.layers !== layersBeforeSticker + 1 || !stickerState.sourceUrl.includes("zestcasesoul-social-transparent.png")) {
          failures.push(`${width}x${height}: sticker was not added as an editable image layer`);
        }
        if (stickerState.kind !== "Стикер" || !stickerState.editorMounted || stickerState.sheetHidden !== "false" || stickerState.sheetTool !== "image") {
          failures.push(`${width}x${height}: adding a sticker did not immediately open its layer editor (${JSON.stringify(stickerState)})`);
        }
        await page.locator("#mobileToolSheetClose").click();
        await page.waitForTimeout(250);
      } else {
        await page.locator("#mobileToolSheetClose").click();
        await page.waitForTimeout(250);
      }

      await page.locator("#mobileSaveButton").click();
      const saveDialogFits = await page.locator("#saveChoiceDialog").evaluate((dialog) => {
        const rect = dialog.getBoundingClientRect();
        return dialog.open && rect.left >= 0 && rect.right <= window.innerWidth && rect.top >= 0 && rect.bottom <= window.innerHeight;
      });
      if (!saveDialogFits) failures.push(`${width}x${height}: save choice dialog does not fit`);
      if (await page.locator("#saveFileChoiceButton").count() !== 1 || await page.locator("#saveProfileChoiceButton").count() !== 1) {
        failures.push(`${width}x${height}: save choices are missing`);
      }
      await page.locator("#closeSaveChoiceButton").click();

      if (width === 390) {
        await page.locator("#userActions").evaluate((element) => element.classList.remove("hidden"));
        await page.waitForTimeout(30);
        const mobileAuthState = await page.evaluate(() => ({
          header: document.querySelector(".mobile-account-label")?.textContent,
          menu: document.querySelector("[data-mobile-account-label]")?.textContent,
          designsHidden: document.querySelector('[data-mobile-nav="designs"]')?.classList.contains("hidden"),
          logoutHidden: document.querySelector('[data-mobile-nav="logout"]')?.classList.contains("hidden")
        }));
        if (mobileAuthState.header !== "Профиль" || mobileAuthState.menu !== "Профиль" || mobileAuthState.designsHidden || mobileAuthState.logoutHidden) {
          failures.push("390x844: mobile profile state did not update after login");
        }
        await page.locator("#userActions").evaluate((element) => element.classList.add("hidden"));
        await page.waitForTimeout(30);
      }
    }

    if (width === 390) {
      const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAD0lEQVR42mP8z8DAwMAAAAYAAWgmWQ0AAAAASUVORK5CYII=", "base64");
      await page.locator("#imageInput").setInputFiles({ name: "touch-test.png", mimeType: "image/png", buffer: png });
      await page.waitForTimeout(600);
      const mobileImageEditor = await page.evaluate(() => ({
        title: document.querySelector("#mobileToolSheetTitle")?.textContent,
        kind: document.querySelector("#imageLayerKind")?.textContent,
        mounted: document.querySelector("#mobileToolSheetContent #imageLayerEditor") !== null,
        deleteButton: document.querySelector("#deleteSelectedImageButton")?.textContent,
        layerCount: window.caseEditorTools.designState().layers.length,
        sheetHidden: document.querySelector("#mobileToolSheet")?.getAttribute("aria-hidden"),
        sheetTool: document.querySelector("#mobileToolSheet")?.dataset.tool || "",
        visible: (() => {
          const element = document.querySelector("#imageLayerEditor");
          if (!element) return false;
          const rect = element.getBoundingClientRect();
          return rect.width > 200 && rect.height > 200;
        })()
      }));
      if (mobileImageEditor.title !== "Редактирование изображения" || mobileImageEditor.kind !== "Фото" || !mobileImageEditor.mounted || !mobileImageEditor.visible || !mobileImageEditor.deleteButton?.includes("Удалить") || mobileImageEditor.sheetHidden !== "false" || mobileImageEditor.sheetTool !== "image") {
        failures.push(`390x844: adding a photo did not immediately open the full image editor (${JSON.stringify(mobileImageEditor)})`);
      }
      await page.locator("#scaleInput").fill("125");
      if (Math.abs((await page.evaluate(() => window.caseEditorTools.selectedImage()?.scale)) - 1.25) > 0.001) {
        failures.push("390x844: image editor scale control did not update the selected photo");
      }
      await page.locator("#scaleInput").fill("100");
      await page.locator("#rotateInput").fill("180");
      const positiveHalfTurn = await page.evaluate(() => window.caseEditorTools.selectedImage()?.rotation);
      await page.locator("#rotateInput").fill("-180");
      const negativeHalfTurn = await page.evaluate(() => window.caseEditorTools.selectedImage()?.rotation);
      if (Math.abs(positiveHalfTurn - Math.PI) > 0.001 || Math.abs(negativeHalfTurn + Math.PI) > 0.001) {
        failures.push("390x844: image rotation control does not cover -180 to 180 degrees");
      }
      await page.locator("#rotateInput").fill("0");
      if (screenshotDir) await page.screenshot({ path: join(screenshotDir, "image-editor-mobile-390.png"), fullPage: false });
      await page.locator("#mobileToolSheetClose").click();
      await page.waitForTimeout(250);

      await page.locator('[data-editor-tool="text"]').click();
      const textForm = page.locator(".mobile-text-tool");
      await textForm.locator('[name="text"]').fill("Привет ZestCaseSoul");
      await textForm.locator('[name="fontFamily"]').selectOption("russo");
      await textForm.locator('[name="fontWeight"]').selectOption("700");
      await textForm.locator('[name="textAlign"]').selectOption("right");
      await textForm.locator('[name="color"]').fill("#d10f2f");
      await textForm.locator('[name="fontSize"]').fill("96");
      await textForm.locator('[name="opacity"]').fill("75");
      await textForm.locator('[name="strokeEnabled"]').check();
      await textForm.locator('[name="shadowEnabled"]').check();
      await textForm.locator('button[type="submit"]').click();
      await page.waitForFunction(() => document.querySelector("#mobileToolSheet")?.getAttribute("aria-hidden") === "true");
      const textState = await page.evaluate(() => ({
        selected: window.caseEditorTools.selectedText(),
        design: window.caseEditorTools.designState()
      }));
      if (textState.selected?.text !== "Привет ZestCaseSoul" || textState.selected?.fontFamily !== "russo" || textState.selected?.opacity !== 0.75) {
        failures.push("390x844: editable text properties were not applied");
      }
      if (textState.design.layers.at(-1)?.type !== "text" || textState.design.layers.at(-1)?.sourceUrl) {
        failures.push("390x844: text was not serialized as an editable object");
      }
      if (!(textState.design.layers.at(-1)?.width > 0) || !(textState.design.layers.at(-1)?.height > 0)) {
        failures.push("390x844: text dimensions were not serialized");
      }

      const textIdsBeforeTemplateSwitch = textState.design.layers.filter((layer) => layer.type === "text").map((layer) => layer.id);
      await page.locator('[data-editor-tool="templates"]').click();
      await page.waitForFunction(() => document.querySelectorAll("#templateList .template-card").length >= 2);
      await page.locator("#templateList .template-card").first().click();
      await page.waitForFunction(() => window.caseEditorTools.designState().layers.some((layer) => layer.sourceUrl?.includes("orange-wave.svg")));
      const firstTemplateState = await page.evaluate(() => window.caseEditorTools.designState());
      const firstTemplateImages = firstTemplateState.layers.filter((layer) => layer.type !== "text");
      const firstTemplateTextIds = firstTemplateState.layers.filter((layer) => layer.type === "text").map((layer) => layer.id);
      if (firstTemplateImages.length !== 1 || !firstTemplateImages[0]?.sourceUrl.includes("orange-wave.svg")) {
        failures.push("390x844: choosing a template did not replace the existing photo and sticker");
      }
      if (JSON.stringify(firstTemplateTextIds) !== JSON.stringify(textIdsBeforeTemplateSwitch)) {
        failures.push("390x844: choosing a template removed or recreated the existing text");
      }

      await page.locator("#templateList .template-card").nth(1).click();
      await page.waitForFunction(() => window.caseEditorTools.designState().layers.some((layer) => layer.sourceUrl?.includes("mint-wave.svg")));
      const secondTemplateState = await page.evaluate(() => window.caseEditorTools.designState());
      const secondTemplateImages = secondTemplateState.layers.filter((layer) => layer.type !== "text");
      const secondTemplateTextIds = secondTemplateState.layers.filter((layer) => layer.type === "text").map((layer) => layer.id);
      if (secondTemplateImages.length !== 1 || !secondTemplateImages[0]?.sourceUrl.includes("mint-wave.svg")) {
        failures.push("390x844: the second template did not replace the first template");
      }
      if (JSON.stringify(secondTemplateTextIds) !== JSON.stringify(textIdsBeforeTemplateSwitch)) {
        failures.push("390x844: switching templates did not preserve the text layers");
      }

      const ordinaryTemplateEffectIsHidden = await page.locator("#deathNoteWatchEffect").evaluate((effect) => effect.hidden);
      if (!ordinaryTemplateEffectIsHidden) failures.push("390x844: an ordinary template triggered the Death Note watch effect");

      await page.locator("#templateList .template-card").nth(2).click();
      await page.waitForFunction(() => window.caseEditorTools.designState().layers.some((layer) => layer.sourceUrl?.includes("cosmic.svg")));
      await page.waitForFunction(() => {
        const effect = document.querySelector("#deathNoteWatchEffect");
        return effect && !effect.hidden && effect.classList.contains("is-active");
      });
      await page.waitForTimeout(250);
      const deathNoteWatchState = await page.evaluate(() => {
        const effect = document.querySelector("#deathNoteWatchEffect");
        const image = document.querySelector("#deathNoteWatchImage");
        const caseCanvas = document.querySelector("#caseCanvas");
        const imageRect = image.getBoundingClientRect();
        const canvasRect = caseCanvas.getBoundingClientRect();
        return {
          width: imageRect.width,
          imageCenter: imageRect.left + imageRect.width / 2,
          canvasLeft: canvasRect.left,
          canvasRight: canvasRect.right,
          source: image.getAttribute("src") || "",
          pointerEvents: getComputedStyle(effect).pointerEvents
        };
      });
      if (deathNoteWatchState.width < 70 || deathNoteWatchState.width > 120) {
        failures.push(`390x844: Death Note watch is not compact (${deathNoteWatchState.width}px)`);
      }
      if (deathNoteWatchState.imageCenter < deathNoteWatchState.canvasLeft || deathNoteWatchState.imageCenter > deathNoteWatchState.canvasRight) {
        failures.push("390x844: Death Note watch is not positioned over the case editor");
      }
      if (!deathNoteWatchState.source.includes("death-note-clock.png")) {
        failures.push("390x844: Death Note watch image was not loaded lazily on selection");
      }
      if (deathNoteWatchState.pointerEvents !== "none") {
        failures.push("390x844: Death Note watch blocks constructor controls");
      }
      await page.waitForFunction(() => document.querySelector("#deathNoteWatchEffect")?.hidden, null, { timeout: 5500 });
      await page.locator("#mobileToolSheetClose").click();
      await page.waitForTimeout(250);

      const printSize = await page.evaluate(async () => {
        const image = new Image();
        image.src = window.caseEditorTools.printDataUrl();
        await image.decode();
        return { width: image.naturalWidth, height: image.naturalHeight };
      });
      if (Math.max(printSize.width, printSize.height) < 2048) failures.push("390x844: production export is below 2048px");
      await page.waitForTimeout(250);

      const layersBeforeAuth = await page.evaluate(() => window.caseEditorTools.designState().layers.length);
      await page.locator("#mobileSaveButton").click();
      await page.locator("#saveProfileChoiceButton").click();
      if (!await page.locator("#authDialog").evaluate((dialog) => dialog.open)) failures.push("390x844: profile save did not request authentication");
      const layersAfterAuth = await page.evaluate(() => window.caseEditorTools.designState().layers.length);
      if (layersAfterAuth !== layersBeforeAuth) failures.push("390x844: design was lost when authentication opened");
      await page.locator("#closeAuthButton").click();
      const textBox = await page.locator("#caseCanvas").boundingBox();
      await page.locator("#caseCanvas").dispatchEvent("pointerdown", { pointerId: 8, pointerType: "touch", clientX: textBox.x + textBox.width / 2, clientY: textBox.y + textBox.height / 2, isPrimary: true, bubbles: true });
      await page.locator("#caseCanvas").dispatchEvent("pointerup", { pointerId: 8, pointerType: "touch", clientX: textBox.x + textBox.width / 2, clientY: textBox.y + textBox.height / 2, isPrimary: true, bubbles: true });
      await page.waitForFunction(() => document.querySelector("#mobileToolSheet")?.getAttribute("aria-hidden") === "false");
      await page.locator('.mobile-text-tool [name="text"]').fill("Новый текст ZCS");
      if (await page.locator('.mobile-text-tool button[type="submit"]').count() !== 0) {
        failures.push("390x844: selected text still requires a submit button");
      }
      await page.waitForTimeout(40);
      if ((await page.evaluate(() => window.caseEditorTools.selectedText()?.text)) !== "Новый текст ZCS") {
        failures.push("390x844: selected text could not be edited");
      }
      await page.locator("#caseCanvas").dispatchEvent("pointerdown", { pointerId: 9, pointerType: "touch", clientX: textBox.x + 2, clientY: textBox.y + 2, isPrimary: true, bubbles: true });
      await page.locator("#caseCanvas").dispatchEvent("pointerup", { pointerId: 9, pointerType: "touch", clientX: textBox.x + 2, clientY: textBox.y + 2, isPrimary: true, bubbles: true });
      await page.waitForFunction(() => document.querySelector("#mobileToolSheet")?.getAttribute("aria-hidden") === "true");
      if (await page.evaluate(() => window.caseEditorTools.selectedText() !== null)) {
        failures.push("390x844: clicking outside the text did not clear its selection");
      }
      await page.locator("#caseCanvas").dispatchEvent("pointerdown", { pointerId: 10, pointerType: "touch", clientX: textBox.x + textBox.width / 2, clientY: textBox.y + textBox.height / 2, isPrimary: true, bubbles: true });
      await page.locator("#caseCanvas").dispatchEvent("pointerup", { pointerId: 10, pointerType: "touch", clientX: textBox.x + textBox.width / 2, clientY: textBox.y + textBox.height / 2, isPrimary: true, bubbles: true });
      await page.waitForFunction(() => document.querySelector("#mobileToolSheet")?.getAttribute("aria-hidden") === "false");
      await page.locator("#mobileToolSheetClose").click();
      await page.waitForTimeout(250);

      const box = await page.locator("#caseCanvas").boundingBox();
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      const positionBeforeMove = await page.evaluate(() => window.caseEditorTools.selectedText()?.x);
      await page.locator("#caseCanvas").dispatchEvent("pointerdown", { pointerId: 7, pointerType: "touch", clientX: cx, clientY: cy, isPrimary: true, bubbles: true });
      await page.locator("#caseCanvas").dispatchEvent("pointermove", { pointerId: 7, pointerType: "touch", clientX: cx + 28, clientY: cy + 10, isPrimary: true, bubbles: true });
      await page.locator("#caseCanvas").dispatchEvent("pointerup", { pointerId: 7, pointerType: "touch", clientX: cx + 28, clientY: cy + 10, isPrimary: true, bubbles: true });
      if ((await page.evaluate(() => window.caseEditorTools.selectedText()?.x)) === positionBeforeMove) failures.push("390x844: selected text did not move with one pointer");
      await page.locator("#caseCanvas").dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch", clientX: cx, clientY: cy, isPrimary: true, bubbles: true });
      await page.locator("#caseCanvas").dispatchEvent("pointerdown", { pointerId: 2, pointerType: "touch", clientX: cx + 20, clientY: cy, bubbles: true });
      await page.locator("#caseCanvas").dispatchEvent("pointermove", { pointerId: 2, pointerType: "touch", clientX: cx + 70, clientY: cy + 12, bubbles: true });
      await page.locator("#caseCanvas").dispatchEvent("pointerup", { pointerId: 2, pointerType: "touch", clientX: cx + 70, clientY: cy + 12, bubbles: true });
      await page.locator("#caseCanvas").dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch", clientX: cx, clientY: cy, bubbles: true });
      const scale = Number(await page.locator("#scaleInput").inputValue());
      if (scale <= 100) failures.push("390x844: two-finger scaling did not update the selected layer");
      if (Math.abs(Number(await page.locator("#rotateInput").inputValue())) < 1) failures.push("390x844: two-finger rotation did not update the selected layer");
      await page.locator("#mobileUndoButton").click();
      if (Number(await page.locator("#scaleInput").inputValue()) !== 100) failures.push("390x844: undo did not restore scale");
      const countBeforeDelete = await page.evaluate(() => window.caseEditorTools.designState().layers.length);
      await page.locator("#mobileDeleteButton").click();
      if (await page.evaluate(() => window.caseEditorTools.designState().layers.length) !== countBeforeDelete - 1) failures.push("390x844: selected text was not deleted");
      await page.locator("#mobileUndoButton").click();
      if (await page.evaluate(() => window.caseEditorTools.designState().layers.length) !== countBeforeDelete) failures.push("390x844: deleted text was not restored by undo");
    }

    if (width === 1366) {
      await page.locator("#templateList .template-card").first().click();
      await page.waitForFunction(() => window.caseEditorTools.designState().layers.some((layer) => layer.sourceUrl?.includes("orange-wave.svg")));
      const desktopCanvasBox = await page.locator("#caseCanvas").boundingBox();
      await page.locator("#caseCanvas").dispatchEvent("pointerdown", { pointerId: 51, pointerType: "mouse", clientX: desktopCanvasBox.x + desktopCanvasBox.width / 2, clientY: desktopCanvasBox.y + desktopCanvasBox.height / 2, isPrimary: true, bubbles: true });
      await page.locator("#caseCanvas").dispatchEvent("pointerup", { pointerId: 51, pointerType: "mouse", clientX: desktopCanvasBox.x + desktopCanvasBox.width / 2, clientY: desktopCanvasBox.y + desktopCanvasBox.height / 2, isPrimary: true, bubbles: true });
      await page.waitForFunction(() => document.querySelector("#mobileToolSheet")?.getAttribute("aria-hidden") === "false");
      await page.waitForTimeout(250);
      const desktopImageEditor = await page.evaluate(() => {
        const sheet = document.querySelector("#mobileToolSheet");
        const editor = document.querySelector("#imageLayerEditor");
        const rect = sheet?.getBoundingClientRect();
        return {
          kind: document.querySelector("#imageLayerKind")?.textContent,
          mounted: editor?.parentElement?.id === "mobileToolSheetContent",
          visible: Boolean(rect && rect.width >= 360 && rect.right <= window.innerWidth && rect.left > window.innerWidth / 2),
          controls: editor?.querySelectorAll('input[type="range"]').length || 0,
          orderActions: editor?.querySelectorAll(".layer-actions button").length || 0
        };
      });
      if (desktopImageEditor.kind !== "Готовый макет" || !desktopImageEditor.mounted || !desktopImageEditor.visible || desktopImageEditor.controls !== 2 || desktopImageEditor.orderActions !== 2) {
        failures.push("1366x900: selecting a template did not open the full right image editor");
      }
      if (screenshotDir) await page.screenshot({ path: join(screenshotDir, "image-editor-desktop-1366.png"), fullPage: false });
      await page.locator("#mobileToolSheetClose").click();
      await page.waitForTimeout(250);
    }

    if (width === 390 || width === 1366) {
      await page.evaluate(() => {
        document.querySelector("#clientView")?.classList.add("hidden");
        document.querySelector("#adminView")?.classList.remove("hidden");
        document.body.classList.remove("editor-toolbar-visible");
      });
      await page.locator('[data-admin-target="templateCategories"]').click();
      const adminNavigationState = await page.evaluate(() => {
        const editors = document.querySelector(".admin-nav-group-editors")?.getBoundingClientRect();
        const categories = document.querySelector(".admin-nav-group-categories")?.getBoundingClientRect();
        return {
          selected: document.querySelector("#adminEditorSelect")?.value,
          active: document.querySelector("[data-admin-target].is-active")?.dataset.adminTarget,
          editorButtons: document.querySelectorAll(".admin-nav-group-editors [data-admin-target]").length,
          categoryButtons: document.querySelectorAll(".admin-nav-group-categories [data-admin-target]").length,
          visibleEditors: [...document.querySelectorAll("[data-admin-editor]:not(.hidden)")].map((element) => element.dataset.adminEditor),
          editors: editors?.toJSON(),
          categories: categories?.toJSON(),
          scrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth
        };
      });
      if (adminNavigationState.selected !== "templateCategories" || adminNavigationState.active !== "templateCategories") {
        failures.push(`${width}x${height}: admin category navigation did not activate the selected section`);
      }
      if (adminNavigationState.editorButtons !== 9 || adminNavigationState.categoryButtons !== 3) {
        failures.push(`${width}x${height}: admin navigation groups contain the wrong number of actions`);
      }
      if (!adminNavigationState.visibleEditors.length || adminNavigationState.visibleEditors.some((value) => value !== "templateCategories")) {
        failures.push(`${width}x${height}: admin navigation showed unrelated editor sections`);
      }
      if (adminNavigationState.scrollWidth > adminNavigationState.viewportWidth + 1) {
        failures.push(`${width}x${height}: admin navigation causes horizontal overflow`);
      }
      if (width === 390 && adminNavigationState.categories.top < adminNavigationState.editors.bottom - 1) {
        failures.push("390x844: admin navigation groups do not stack on mobile");
      }
      if (width === 1366 && Math.abs(adminNavigationState.categories.top - adminNavigationState.editors.top) > 2) {
        failures.push("1366x900: admin navigation groups do not align on desktop");
      }
      if (screenshotDir) {
        await page.locator(".admin-navigation").scrollIntoViewIfNeeded();
        await page.screenshot({ path: join(screenshotDir, `admin-navigation-${width}.png`), fullPage: false });
      }
      await page.evaluate(() => {
        document.querySelector("#adminView")?.classList.add("hidden");
        document.querySelector("#clientView")?.classList.remove("hidden");
      });
    }

    if (pageErrors.length) failures.push(`${width}x${height}: ${pageErrors.join(" | ")}`);
    if (width > 860) {
      if (width === 1366 && screenshotDir) {
        await page.locator('[data-editor-tool="stickers"]').evaluate((button) => button.click());
        await page.waitForFunction(() => document.querySelector("#mobileToolSheet")?.getAttribute("aria-hidden") === "false");
        await page.waitForTimeout(220);
        await page.screenshot({ path: join(screenshotDir, "stickers-desktop-1366.png"), fullPage: false });
        await page.locator("#mobileToolSheetClose").click();
        await page.waitForTimeout(250);
      }
      await page.locator("#addTextButton").click();
      if (await page.locator("#mobileToolSheet").getAttribute("aria-hidden") !== "false") failures.push(`${width}x${height}: desktop text editor did not open`);
      const desktopTextForm = page.locator(".mobile-text-tool");
      await desktopTextForm.locator('[name="text"]').fill("Desktop text");
      await desktopTextForm.locator('button[type="submit"]').click();
      await page.waitForFunction(() => document.querySelector("#mobileToolSheet")?.getAttribute("aria-hidden") === "true");
      const desktopCanvas = await page.locator("#caseCanvas").boundingBox();
      await page.locator("#caseCanvas").dispatchEvent("pointerdown", { pointerId: 11, pointerType: "mouse", clientX: desktopCanvas.x + desktopCanvas.width / 2, clientY: desktopCanvas.y + desktopCanvas.height / 2, isPrimary: true, bubbles: true });
      await page.locator("#caseCanvas").dispatchEvent("pointerup", { pointerId: 11, pointerType: "mouse", clientX: desktopCanvas.x + desktopCanvas.width / 2, clientY: desktopCanvas.y + desktopCanvas.height / 2, isPrimary: true, bubbles: true });
      await page.waitForFunction(() => document.querySelector("#mobileToolSheet")?.getAttribute("aria-hidden") === "false");
      if (await page.locator('.mobile-text-tool button[type="submit"]').count() !== 0) {
        failures.push(`${width}x${height}: selected desktop text opened the creation form instead of the editor`);
      }
      await page.locator("#mobileToolSheetClose").click();

      const textLayersBeforeTemplateAdd = await page.evaluate(() => window.caseEditorTools.designState().layers.filter((layer) => layer.type === "text"));
      await page.evaluate(() => {
        document.querySelector("#clientWorkspace")?.classList.add("template-builder-workspace");
        document.querySelector("#clientView")?.classList.add("hidden");
        document.querySelector("#adminView")?.classList.remove("hidden");
        document.querySelector("#adminTemplateAddTextButton")?.click();
      });
      await page.waitForFunction(() => document.querySelector("#mobileToolSheet")?.getAttribute("aria-hidden") === "false");
      await page.waitForTimeout(220);
      const templateDrawer = await page.locator("#mobileToolSheet").evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return {
          isTemplateBuilder: element.classList.contains("is-template-builder"),
          bodyState: document.body.classList.contains("template-tool-drawer-open"),
          tool: element.dataset.tool,
          context: element.dataset.context,
          parent: element.parentElement?.id,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          activeField: document.activeElement?.getAttribute("name")
        };
      });
      if (!templateDrawer.isTemplateBuilder || !templateDrawer.bodyState || templateDrawer.tool !== "text" || templateDrawer.context !== "admin-template-builder" || templateDrawer.parent !== "adminTemplateTextDrawerMount") {
        failures.push(`${width}x${height}: template text editor is not in side-drawer mode`);
      }
      if (templateDrawer.left < width / 2 || templateDrawer.right > width + 1 || templateDrawer.top < 0 || templateDrawer.bottom > height + 1) {
        failures.push(`${width}x${height}: template text side drawer is outside the viewport`);
      }
      if (templateDrawer.activeField !== "text") failures.push(`${width}x${height}: template text field did not receive focus`);
      await page.locator('.mobile-text-tool [name="text"]').fill("Вторая надпись макета");
      if (await page.locator("[data-text-count]").textContent() !== "21/160") {
        failures.push(`${width}x${height}: template text counter is incorrect`);
      }
      await page.locator('.mobile-text-tool button[type="submit"]').click();
      await page.waitForFunction(() => document.querySelector("#mobileToolSheet")?.getAttribute("aria-hidden") === "true");
      const textLayersAfterTemplateAdd = await page.evaluate(() => window.caseEditorTools.designState().layers.filter((layer) => layer.type === "text"));
      if (textLayersAfterTemplateAdd.length !== textLayersBeforeTemplateAdd.length + 1) {
        failures.push(`${width}x${height}: adding template text overwrote the selected text layer`);
      }
      if (textLayersAfterTemplateAdd[0]?.text !== textLayersBeforeTemplateAdd[0]?.text || textLayersAfterTemplateAdd.at(-1)?.text !== "Вторая надпись макета") {
        failures.push(`${width}x${height}: template text content was not preserved correctly`);
      }
      await page.evaluate(() => {
        document.querySelector("#clientWorkspace")?.classList.remove("template-builder-workspace");
        document.querySelector("#clientView")?.classList.remove("hidden");
        document.querySelector("#adminView")?.classList.add("hidden");
      });
    }
    console.log(`ok ${width}x${height}: scroll ${layout.scrollWidth}/${layout.viewportWidth}, canvas ${Math.round(layout.canvas.width)}px`);
    await page.close();
  }
} finally {
  await browser.close();
  if (!externalUrl) await new Promise((resolve) => server.close(resolve));
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("All mobile layout checks passed.");
