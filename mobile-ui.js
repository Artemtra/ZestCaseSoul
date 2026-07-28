(() => {
  const mobileQuery = window.matchMedia("(max-width: 860px)");
  const menu = document.querySelector("#mobileMenu");
  const menuButton = document.querySelector("#mobileMenuButton");
  const menuClose = document.querySelector("#mobileMenuClose");
  const menuBackdrop = document.querySelector("#mobileMenuBackdrop");
  const accountButton = document.querySelector("#mobileAccountButton");
  const accountLabel = accountButton?.querySelector(".mobile-account-label");
  const accountIcon = accountButton?.querySelector(".mobile-account-icon");
  const menuAccountButton = document.querySelector('[data-mobile-nav="account"]');
  const menuAccountLabel = document.querySelector("[data-mobile-account-label]");
  const menuProfileIcon = menuAccountButton?.querySelector(".mobile-menu-profile-icon");
  const mobileAuthOnly = [...document.querySelectorAll("[data-mobile-auth-only]")];
  const sheet = document.querySelector("#mobileToolSheet");
  const sheetTitle = document.querySelector("#mobileToolSheetTitle");
  const sheetContent = document.querySelector("#mobileToolSheetContent");
  const sheetClose = document.querySelector("#mobileToolSheetClose");
  const adminTemplateTextDrawerMount = document.querySelector("#adminTemplateTextDrawerMount");
  const sheetHomeParent = sheet?.parentNode || null;
  const sheetHomeNextSibling = sheet?.nextSibling || null;
  const editorButtons = [...document.querySelectorAll("[data-editor-tool]")];
  const controls = document.querySelector("#clientWorkspace .controls");
  const clientView = document.querySelector("#clientView");
  const mobileUndoButton = document.querySelector("#mobileUndoButton");
  const mobileRedoButton = document.querySelector("#mobileRedoButton");
  const mobileDeleteButton = document.querySelector("#mobileDeleteButton");
  const mobileSaveButton = document.querySelector("#mobileSaveButton");
  const addTextButton = document.querySelector("#addTextButton");
  const imageLayerEditor = document.querySelector("#imageLayerEditor");
  const imageLayerKind = document.querySelector("#imageLayerKind");
  const imageLayerTitle = document.querySelector("#imageLayerTitle");
  const imageLayerHint = document.querySelector("#imageLayerHint");
  const editorPreview = document.querySelector("#clientWorkspace .preview-wrap");
  const topbar = document.querySelector(".topbar");
  const editorToolbar = document.querySelector(".mobile-editor-toolbar");
  const movedNodes = new Map();
  let closeTimer = 0;
  let restoreTimer = 0;
  let menuAnimationFrame = 0;
  let editorInView = false;

  const toolTitles = {
    templates: "Готовые макеты",
    stickers: "Стикеры",
    text: "Текст",
    image: "Редактирование изображения",
    layers: "Редактирование изображения",
    settings: "Настройки и сохранение"
  };

  function updateImageLayerEditor() {
    const layer = window.caseEditorTools?.selectedImage?.();
    if (!layer) return null;
    const copy = {
      sticker: {
        kind: "Стикер",
        title: "Стикер выбран",
        hint: "Настройте размер, угол и порядок фигурки на чехле."
      },
      template: {
        kind: "Готовый макет",
        title: "Макет выбран",
        hint: "Подгоните макет по размеру и расположите его относительно других изображений."
      },
      photo: {
        kind: "Фото",
        title: "Фотография выбрана",
        hint: "Масштабируйте, поворачивайте и меняйте порядок фотографии."
      }
    }[layer.kind] || {
      kind: "Изображение",
      title: "Изображение выбрано",
      hint: "Меняйте размер, угол и положение слоя — результат сразу появится на чехле."
    };
    if (imageLayerKind) imageLayerKind.textContent = copy.kind;
    if (imageLayerTitle) imageLayerTitle.textContent = copy.title;
    if (imageLayerHint) imageLayerHint.textContent = copy.hint;
    return layer;
  }

  function isSignedIn() {
    return !document.querySelector("#userActions")?.classList.contains("hidden");
  }

  function openAccount() {
    if (isSignedIn()) document.querySelector("#openProfileButton")?.click();
    else document.querySelector("#openLoginButton")?.click();
  }

  function setMobileAvatar(container) {
    if (!container) return;
    const sourceImage = document.querySelector("#openProfileButton img");
    container.replaceChildren();
    if (sourceImage) container.append(sourceImage.cloneNode());
    else container.textContent = "●";
  }

  function syncMobileAuthUi() {
    const signedIn = isSignedIn();
    mobileAuthOnly.forEach((item) => item.classList.toggle("hidden", !signedIn));
    accountButton?.classList.toggle("is-profile", signedIn);
    menuAccountButton?.classList.toggle("is-profile", signedIn);
    if (accountLabel) accountLabel.textContent = signedIn ? "Профиль" : "Войти";
    if (menuAccountLabel) menuAccountLabel.textContent = signedIn ? "Профиль" : "Войти";
    accountButton?.setAttribute("aria-label", signedIn ? "Профиль" : "Войти");
    if (signedIn) {
      setMobileAvatar(accountIcon);
      setMobileAvatar(menuProfileIcon);
    }
  }

  function updateMobileEditorHeight() {
    if (!mobileQuery.matches || !editorPreview) {
      document.documentElement.style.removeProperty("--mobile-editor-max-height");
      return;
    }
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const headerHeight = topbar?.getBoundingClientRect().height || 68;
    const toolbarHeight = editorToolbar?.getBoundingClientRect().height || 70;
    const available = Math.max(280, Math.floor(viewportHeight - headerHeight - toolbarHeight - 40));
    document.documentElement.style.setProperty("--mobile-editor-max-height", `${available}px`);
  }

  function syncEditorToolbarVisibility() {
    document.body.classList.toggle("editor-toolbar-visible", mobileQuery.matches && editorInView);
  }

  function openMenu() {
    window.clearTimeout(closeTimer);
    menuBackdrop.hidden = false;
    menuAnimationFrame = requestAnimationFrame(() => {
      menuAnimationFrame = 0;
      menu.classList.add("is-open");
      menuBackdrop.classList.add("is-open");
    });
    menu.setAttribute("aria-hidden", "false");
    menuButton.setAttribute("aria-expanded", "true");
    document.body.classList.add("mobile-menu-open");
    menuClose.focus({ preventScroll: true });
  }

  function closeMenu({ returnFocus = true } = {}) {
    cancelAnimationFrame(menuAnimationFrame);
    menuAnimationFrame = 0;
    menu.classList.remove("is-open");
    menuBackdrop.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    menuButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("mobile-menu-open");
    closeTimer = window.setTimeout(() => {
      menuBackdrop.hidden = true;
    }, 230);
    if (returnFocus) menuButton.focus({ preventScroll: true });
  }

  function rememberAndMove(node) {
    if (!node || movedNodes.has(node)) return;
    const placeholder = document.createComment(`mobile-tool:${node.dataset.mobileTool || node.id || "item"}`);
    node.parentNode.insertBefore(placeholder, node);
    movedNodes.set(node, placeholder);
    sheetContent.append(node);
  }

  function restoreSheetNodes() {
    movedNodes.forEach((placeholder, node) => {
      placeholder.parentNode?.insertBefore(node, placeholder);
      placeholder.remove();
    });
    movedNodes.clear();
    sheetContent.replaceChildren();
  }

  function mountToolSheet(isTemplateBuilder) {
    if (isTemplateBuilder && adminTemplateTextDrawerMount) {
      if (sheet.parentElement !== adminTemplateTextDrawerMount) adminTemplateTextDrawerMount.append(sheet);
      sheet.dataset.context = "admin-template-builder";
      return;
    }
    if (sheetHomeParent && sheet.parentNode !== sheetHomeParent) {
      if (sheetHomeNextSibling?.parentNode === sheetHomeParent) sheetHomeParent.insertBefore(sheet, sheetHomeNextSibling);
      else sheetHomeParent.append(sheet);
    }
    sheet.dataset.context = "constructor";
  }

  function closeToolSheet() {
    window.clearTimeout(restoreTimer);
    sheet.classList.remove("is-open");
    sheet.classList.remove("is-template-builder");
    sheet.removeAttribute("data-tool");
    sheet.setAttribute("aria-hidden", "true");
    document.body.classList.remove("mobile-sheet-open");
    document.body.classList.remove("template-tool-drawer-open");
    editorButtons.forEach((button) => button.classList.remove("is-active"));
    restoreTimer = window.setTimeout(() => {
      restoreTimer = 0;
      restoreSheetNodes();
    }, 230);
  }

  function openToolSheet(tool, { forceNewText = false } = {}) {
    if (tool === "photo") {
      document.querySelector("#imageInput")?.click();
      return;
    }
    window.clearTimeout(restoreTimer);
    restoreTimer = 0;
    const isTemplateBuilder = document.querySelector("#clientWorkspace")?.classList.contains("template-builder-workspace");
    mountToolSheet(Boolean(isTemplateBuilder));
    sheet.classList.toggle("is-template-builder", Boolean(isTemplateBuilder));
    sheet.dataset.tool = tool;
    sheet.classList.add("is-open");
    sheet.setAttribute("aria-hidden", "false");
    document.body.classList.add("mobile-sheet-open");
    document.body.classList.toggle("template-tool-drawer-open", Boolean(isTemplateBuilder));
    restoreSheetNodes();
    sheetTitle.textContent = toolTitles[tool] || "Инструменты";
    editorButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.editorTool === tool));

    if (tool === "image" || tool === "layers") {
      const selectedImage = updateImageLayerEditor();
      if (selectedImage && imageLayerEditor) {
        rememberAndMove(imageLayerEditor);
      } else {
        const empty = document.createElement("div");
        empty.className = "text-tool-intro image-tool-intro";
        empty.innerHTML = '<span class="text-tool-symbol image-tool-symbol" aria-hidden="true">✦</span><div><strong>Сначала выберите изображение</strong><span>Нажмите на фото, макет или стикер прямо на чехле.</span></div>';
        sheetContent.append(empty);
      }
      sheetClose.focus({ preventScroll: true });
    } else if (tool === "text") {
      const selectedText = forceNewText ? null : window.caseEditorTools?.selectedText();
      const isEditingText = Boolean(selectedText);
      sheetTitle.textContent = isEditingText ? "Редактирование текста" : "Новая надпись";
      const form = document.createElement("form");
      form.className = "mobile-text-tool";
      form.innerHTML = `
        <div class="text-tool-intro">
          <span class="text-tool-symbol" aria-hidden="true">T</span>
          <div>
            <strong>${isEditingText ? "Текст уже на макете" : "Добавьте текст на макет"}</strong>
            <span>${isEditingText ? "Меняйте надпись — результат сразу появится на чехле." : "Введите надпись и настройте её внешний вид."}</span>
          </div>
        </div>
        <label class="text-tool-copy-field"><span>Текст <output data-text-count>0/160</output></span><textarea name="text" rows="3" maxlength="160" autocomplete="off" placeholder="Например: Сделано с душой" required></textarea></label>
        <div class="mobile-text-tool-grid">
          <label><span>Шрифт</span><select name="fontFamily"><option value="manrope">Manrope</option><option value="unbounded">Unbounded</option><option value="marck">Marck Script</option><option value="russo">Russo One</option></select></label>
          <label><span>Начертание</span><select name="fontWeight"><option value="400">Обычное</option><option value="700">Полужирное</option></select></label>
          <label><span>Выравнивание</span><select name="textAlign"><option value="left">Слева</option><option value="center">По центру</option><option value="right">Справа</option></select></label>
          <label><span>Цвет</span><input name="color" type="color" value="#17201b"></label>
        </div>
        <div class="mobile-text-tool-row">
          <label><span>Размер</span><input name="fontSize" type="range" min="36" max="180" value="72"></label>
          <label><span>Прозрачность</span><input name="opacity" type="range" min="10" max="100" value="100"></label>
        </div>
        <div class="mobile-text-effect">
          <label class="checkbox-line"><input name="strokeEnabled" type="checkbox"> Обводка</label>
          <input name="strokeColor" type="color" value="#ffffff" aria-label="Цвет обводки">
          <label><span>Толщина</span><input name="strokeWidth" type="range" min="0" max="12" value="3"></label>
        </div>
        <div class="mobile-text-effect">
          <label class="checkbox-line"><input name="shadowEnabled" type="checkbox"> Тень</label>
          <input name="shadowColor" type="color" value="#000000" aria-label="Цвет тени">
          <label><span>Размытие</span><input name="shadowBlur" type="range" min="0" max="30" value="8"></label>
        </div>
        <p class="mobile-tool-message" role="status" aria-live="polite"></p>
        ${selectedText ? "" : "<button class=\"primary text-tool-submit\" type=\"submit\">Добавить на макет</button>"}
      `;
      if (selectedText) {
        Object.entries(selectedText).forEach(([name, value]) => {
          const field = form.elements.namedItem(name);
          if (!field) return;
          if (field.type === "checkbox") field.checked = Boolean(value);
          else if (name === "opacity") field.value = String(Math.round(Number(value) * 100));
          else field.value = String(value);
        });
      }
      const textInput = form.elements.namedItem("text");
      const textCount = form.querySelector("[data-text-count]");
      const updateTextCount = () => {
        textCount.textContent = `${textInput.value.length}/160`;
      };
      updateTextCount();
      textInput.addEventListener("input", updateTextCount);
      const readTextOptions = () => {
        const data = new FormData(form);
        return {
          text: data.get("text"),
          color: data.get("color"),
          fontFamily: data.get("fontFamily"),
          fontSize: data.get("fontSize"),
          fontWeight: data.get("fontWeight"),
          textAlign: data.get("textAlign"),
          opacity: Number(data.get("opacity")) / 100,
          strokeEnabled: data.has("strokeEnabled"),
          strokeColor: data.get("strokeColor"),
          strokeWidth: data.get("strokeWidth"),
          shadowEnabled: data.has("shadowEnabled"),
          shadowColor: data.get("shadowColor"),
          shadowBlur: data.get("shadowBlur")
        };
      };
      const applySelectedTextChanges = () => {
        if (!selectedText) return;
        const message = form.querySelector('[role="status"]');
        try {
          window.caseEditorTools?.updateSelectedText(readTextOptions());
          message.textContent = "Изменения применены.";
        } catch (error) {
          message.textContent = error.message || "Не удалось изменить текст.";
        }
      };
      if (selectedText) {
        form.addEventListener("input", applySelectedTextChanges);
        form.addEventListener("change", applySelectedTextChanges);
      }
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        // In the admin template builder this form is rendered inside the
        // template form. Do not let its submit bubble up and save a template.
        event.stopPropagation();
        if (selectedText) {
          applySelectedTextChanges();
          return;
        }
        const submit = form.querySelector('button[type="submit"]');
        const message = form.querySelector(".mobile-tool-message");
        submit.disabled = true;
        submit.textContent = "Добавляю...";
        try {
          await window.caseEditorTools?.saveText({ ...readTextOptions(), createNew: forceNewText });
          closeToolSheet();
        } catch (error) {
          message.textContent = error.message || "Не удалось добавить текст.";
        } finally {
          submit.disabled = false;
          submit.textContent = "Добавить на макет";
        }
      });
      sheetContent.append(form);
      if (isTemplateBuilder) form.scrollIntoView({ behavior: "smooth", block: "nearest" });
      window.requestAnimationFrame(() => textInput.focus({ preventScroll: true }));
    } else {
      controls.querySelectorAll(`[data-mobile-tool="${tool}"]`).forEach(rememberAndMove);
      if (tool === "settings") rememberAndMove(document.querySelector("#saveProfileButton"));
      sheetClose.focus({ preventScroll: true });
    }
  }

  function goToEditor(tool = "") {
    document.querySelector("#backToClientButton:not(.hidden)")?.click();
    const routed = window.caseEditorRouter?.navigate("/constructor");
    if (!routed) {
      if (window.location.pathname !== "/constructor") history.pushState({}, "", "/constructor");
      clientView?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (tool) window.setTimeout(() => openToolSheet(tool), 360);
  }

  menuButton?.addEventListener("click", openMenu);
  menuClose?.addEventListener("click", () => closeMenu());
  menuBackdrop?.addEventListener("click", () => closeMenu());
  accountButton?.addEventListener("click", openAccount);
  sheetClose?.addEventListener("click", closeToolSheet);
  editorButtons.forEach((button) => button.addEventListener("click", () => {
    openToolSheet(button.dataset.editorTool, { forceNewText: button.dataset.editorTool === "text" });
  }));
  addTextButton?.addEventListener("click", () => openToolSheet("text", { forceNewText: true }));
  window.addEventListener("case-editor:open-text-editor", (event) => {
    openToolSheet("text", { forceNewText: Boolean(event.detail?.forceNewText) });
  });
  window.addEventListener("case-editor:text-selected", () => {
    openToolSheet("text");
  });
  window.addEventListener("case-editor:image-selected", () => {
    openToolSheet("image");
  });
  window.addEventListener("case-editor:close-tool-editor", closeToolSheet);

  document.querySelectorAll("[data-mobile-nav]").forEach((item) => {
    item.addEventListener("click", (event) => {
      const action = item.dataset.mobileNav;
      closeMenu({ returnFocus: false });
      if (action === "home") {
        event.preventDefault();
        window.caseEditorRouter?.navigate("/") || window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (action === "create") {
        event.preventDefault();
        goToEditor();
      } else if (["designs", "orders", "account"].includes(action)) {
        event.preventDefault();
        const destination = action === "account" ? "/profile" : `/${action}`;
        if (!window.caseEditorRouter?.navigate(destination)) openAccount();
      } else if (action === "logout") {
        document.querySelector("#logoutButton")?.click();
      }
    });
  });

  mobileUndoButton?.addEventListener("click", () => window.caseEditorHistory?.undo());
  mobileRedoButton?.addEventListener("click", () => window.caseEditorHistory?.redo());
  mobileDeleteButton?.addEventListener("click", () => window.caseEditorHistory?.removeSelected());
  mobileSaveButton?.addEventListener("click", () => document.querySelector("#saveButton")?.click());

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (sheet.getAttribute("aria-hidden") === "false") {
      event.preventDefault();
      closeToolSheet();
    } else if (menu.getAttribute("aria-hidden") === "false") {
      event.preventDefault();
      closeMenu();
    }
  }, true);

  mobileQuery.addEventListener("change", (event) => {
    updateMobileEditorHeight();
    syncEditorToolbarVisibility();
    if (event.matches) return;
    closeMenu({ returnFocus: false });
    closeToolSheet();
    restoreSheetNodes();
  });

  const authState = document.querySelector("#userActions");
  const profileSource = document.querySelector("#openProfileButton");
  new MutationObserver(syncMobileAuthUi).observe(authState, { attributes: true, attributeFilter: ["class"] });
  new MutationObserver(syncMobileAuthUi).observe(profileSource, { childList: true, subtree: true });
  const editorResizeObserver = new ResizeObserver(updateMobileEditorHeight);
  if (topbar) editorResizeObserver.observe(topbar);
  if (editorPreview) editorResizeObserver.observe(editorPreview);
  const editorVisibilityObserver = new IntersectionObserver((entries) => {
    editorInView = Boolean(entries[0]?.isIntersecting);
    syncEditorToolbarVisibility();
  }, { threshold: 0.08, rootMargin: "80px 0px 80px" });
  if (editorPreview) editorVisibilityObserver.observe(editorPreview);
  window.visualViewport?.addEventListener("resize", updateMobileEditorHeight);
  window.addEventListener("orientationchange", updateMobileEditorHeight);
  syncMobileAuthUi();
  updateMobileEditorHeight();
})();
