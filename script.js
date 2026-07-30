const defaultCasePrice = 899;
const fallbackModels = [
  { id: 1, name: "iPhone 15 Pro Max", w: 330, h: 680, r: 56, camera: "iphone-pro", color: "#d8d0c4" },
  { id: 2, name: "iPhone 15 / 15 Plus", w: 326, h: 668, r: 54, camera: "iphone-dual", color: "#d9eef0" },
  { id: 3, name: "iPhone 14 Pro", w: 320, h: 660, r: 52, camera: "iphone-pro", color: "#dfd7ef" },
  { id: 4, name: "iPhone 13", w: 318, h: 654, r: 50, camera: "iphone-dual-diagonal", color: "#f4d9d2" },
  { id: 5, name: "Samsung Galaxy S24 Ultra", w: 338, h: 690, r: 34, camera: "samsung-ultra", color: "#c9c5b8" },
  { id: 6, name: "Samsung Galaxy S24", w: 318, h: 660, r: 48, camera: "samsung-line", color: "#d9e5f5" },
  { id: 7, name: "Samsung Galaxy S24 FE", w: 330, h: 690, r: 46, camera: "samsung-s24-fe", color: "#3a3a39", logo: "samsung" },
  { id: 8, name: "Samsung Galaxy A55", w: 330, h: 682, r: 46, camera: "samsung-line", color: "#e6e9ef" },
  { id: 9, name: "Xiaomi 14", w: 320, h: 662, r: 44, camera: "xiaomi-square", color: "#d7e1dc" },
  { id: 10, name: "Redmi Note 13 Pro", w: 334, h: 690, r: 44, camera: "redmi-panel", color: "#d7d8e7" },
  { id: 11, name: "Google Pixel 8 Pro", w: 326, h: 676, r: 46, camera: "pixel-bar", color: "#d8e2d6" },
  { id: 12, name: "Google Pixel 8", w: 314, h: 650, r: 46, camera: "pixel-bar", color: "#e3d7cf" },
  { id: 13, name: "OnePlus 12", w: 328, h: 684, r: 48, camera: "oneplus-circle", color: "#d7eadb" }
];

let models = [...fallbackModels];
let modelCatalog = [];
let modelCatalogLoaded = false;
let modelCatalogRequest = null;
let adminModels = [];
let templates = [];
let templateCatalog = [];
let templateCatalogLoaded = false;
let templateCatalogRequest = null;
let stickers = [];
let stickerCatalog = [];
let stickerCatalogLoaded = false;
let stickerCatalogRequest = null;
let adminStickers = [];
let adminStickersRequest = null;
let adminStickersLoaded = false;
let phoneModelCategories = [];
let templateCategories = [];
let stickerCategories = [];
let adminPhoneModelCategories = [];
let adminTemplateCategories = [];
let adminStickerCategories = [];
let publicCategoriesLoaded = false;
let publicCategoriesRequest = null;
const adminCategoryState = {
  models: { loaded: false, request: null },
  templates: { loaded: false, request: null },
  stickers: { loaded: false, request: null }
};
let selectedModelCategoryId = "";
let selectedTemplateCategoryId = "";
let selectedStickerCategoryId = "";
let modelPickerCategoryId = "";
let modelPickerModels = [];
let modelPickerSearchTimer = null;
let currentUser = null;
let adminUsers = [];
let adminOrders = [];
let adminAvatars = [];
let avatarOptions = [];
let executorOrders = [];
let executorShowShipped = false;
let supportMessages = [];
let supportLastMessageId = 0;
let supportPollTimer = null;
let supportLoadRequest = null;
let adminSupportConversations = [];
let adminSupportMessages = [];
let activeAdminSupportConversationId = null;
let adminSupportLastMessageId = 0;
let adminSupportPollTimer = null;
let adminSupportLoadRequest = null;
let adminSupportMessagesRequest = null;
let authMode = "register";
let resetPasswordToken = null;
let pendingVerificationEmail = "";
let pendingProfileSaveAfterAuth = false;
let editingTemplateId = null;
let editingStickerId = null;
let editingModelId = null;
let currentModel = models[0];
let activeTemplateId = null;
let templateApplyRequestId = 0;
let userImage = null;
let userLayers = [];
let selectedLayerId = null;
let savedDesigns = [];
let profileOrders = [];
let profileOrderFilter = "all";
const designDetailCache = new Map();
let activeProfileDesignId = null;
let selectedProfileDesignIds = new Set();
let profileSelectionDrag = { active: false, startIndex: -1, currentIndex: -1 };
const profileTapMovementTolerance = 12;
let imageState = { x: 0, y: 0, scale: 1, rotation: 0 };
let drag = { active: false, startX: 0, startY: 0, imageX: 0, imageY: 0 };
const canvasPointers = new Map();
let canvasGesture = null;
let gestureHistoryStart = null;
let renderFrame = 0;
const designUndoStack = [];
const designRedoStack = [];
const modelImageCache = new Map();
let cameraMaskImage = null;
let cameraMaskDirty = false;
let adminPhoneImage = null;
let adminPreviewTestImage = null;
let usePhoneImageForCamera = false;
let adminCameraPreviewDrag = null;
let eraserDrawing = false;
let eraserHistory = [];
let eraserRedoHistory = [];
let eraserOriginalImageData = null;
let maskToolModeValue = "eraser";
let maskToolDrag = null;
let protectedFrame = { enabled: false, x: 24, y: 24, w: 180, h: 180, radius: 24, thickness: 4, color: "#111816" };
let protectionStrokes = [];
let protectionGuide = { x: 120, y: 120, radius: 42 };
let protectionMaskCanvas = null;
let protectionMaskCtx = null;
let protectionGuideVisible = true;
let gapHighlightVisible = false;
let maskZoom = 1;

const fallbackTemplates = [
  { id: "demo-1", title: "Оранжевый вихрь", phoneModelId: null, imageUrl: makeTemplateSvg("#f06b34", "#ffd166", "Вихрь") },
  { id: "demo-2", title: "Мятная волна", phoneModelId: null, imageUrl: makeTemplateSvg("#96d8b8", "#214f4b", "Волна") },
  { id: "demo-3", title: "Космос", phoneModelId: null, imageUrl: makeTemplateSvg("#121826", "#91c9e8", "Космос") },
  { id: "demo-4", title: "Песочный минимализм", phoneModelId: null, imageUrl: makeTemplateSvg("#fff1d7", "#9f3518", "Minimal") }
];

const tokenKey = "caseEditorToken";
const sessionUserKey = "caseEditorUser";
const supportGuestTokenKey = "zestCaseSupportGuestToken";
const supportGuestOwnerKey = "zestCaseSupportGuestOwner";
const modelsCacheKey = "caseEditorModelsV2";
const templatesCacheKey = "caseEditorTemplates";
const stickersCacheKey = "caseEditorStickers";
const avatarOptionsCacheKey = "caseEditorAvatarOptions";
const profileDesignsCachePrefix = "caseEditorProfileDesigns:";
const maxImageLayers = 10;
const maxTextLayers = 7;
const canvas = document.querySelector("#caseCanvas");
const ctx = canvas.getContext("2d");
const modelSelect = document.querySelector("#modelSelect");
const modelCategorySelect = document.querySelector("#modelCategorySelect");
const modelSearchInput = document.querySelector("#modelSearchInput");
const templateCategoryPicker = document.querySelector("#templateCategoryPicker");
const stickerCategoryPicker = document.querySelector("#stickerCategoryPicker");
let openModelPickerButton = null;
let modelPickerDialog = null;
let modelPickerSearchInput = null;
let modelPickerCategoryList = null;
let modelPickerModelList = null;
let modelPickerCurrent = null;
const templateModel = document.querySelector("#templateModel");
const modelName = document.querySelector("#modelName");
const stockNotice = document.querySelector("#stockNotice");
const modelPrice = document.querySelector("#modelPrice");
const modelOldPrice = document.querySelector("#modelOldPrice");
const modelProduction = document.querySelector("#modelProduction");
const modelMaterial = document.querySelector("#modelMaterial");
const heroPrice = document.querySelector("#heroPrice");
const imageInput = document.querySelector("#imageInput");
const scaleInput = document.querySelector("#scaleInput");
const rotateInput = document.querySelector("#rotateInput");
const scaleOutput = document.querySelector("#scaleOutput");
const rotateOutput = document.querySelector("#rotateOutput");
const resetButton = document.querySelector("#resetButton");
const saveButton = document.querySelector("#saveButton");
const saveProfileButton = document.querySelector("#saveProfileButton");
const saveChoiceDialog = document.querySelector("#saveChoiceDialog");
const closeSaveChoiceButton = document.querySelector("#closeSaveChoiceButton");
const saveFileChoiceButton = document.querySelector("#saveFileChoiceButton");
const saveProfileChoiceButton = document.querySelector("#saveProfileChoiceButton");
const saveChoiceStatus = document.querySelector("#saveChoiceStatus");
const actionConfirmDialog = document.querySelector("#actionConfirmDialog");
const actionConfirmMessage = document.querySelector("#actionConfirmMessage");
const closeActionConfirmButton = document.querySelector("#closeActionConfirmButton");
const cancelActionConfirmButton = document.querySelector("#cancelActionConfirmButton");
const acceptActionConfirmButton = document.querySelector("#acceptActionConfirmButton");
const sendBackwardButton = document.querySelector("#sendBackwardButton");
const bringForwardButton = document.querySelector("#bringForwardButton");
const deleteSelectedImageButton = document.querySelector("#deleteSelectedImageButton");
const templateList = document.querySelector("#templateList");
const templatesStatus = document.querySelector("#templatesStatus");
const deathNoteWatchEffect = document.querySelector("#deathNoteWatchEffect");
const deathNoteWatchImage = document.querySelector("#deathNoteWatchImage");
const stickerList = document.querySelector("#stickerList");
const stickersStatus = document.querySelector("#stickersStatus");
const clientView = document.querySelector("#clientView");
const clientWorkspace = document.querySelector("#clientWorkspace");
const marketingHero = document.querySelector("#marketingHero");
const storefrontContent = document.querySelector("#storefrontContent");
const legalContent = document.querySelector("#legalContent");
const legalDocuments = [...document.querySelectorAll("[data-legal-page]")];
const adminView = document.querySelector("#adminView");
const executorView = document.querySelector("#executorView");
const guestActions = document.querySelector("#guestActions");
const userActions = document.querySelector("#userActions");
const userBadge = document.querySelector("#userBadge");
const openLoginButton = document.querySelector("#openLoginButton");
const openRegisterButton = document.querySelector("#openRegisterButton");
const logoutButton = document.querySelector("#logoutButton");
const openAdminButton = document.querySelector("#openAdminButton");
const openProfileButton = document.querySelector("#openProfileButton");
const backToClientButton = document.querySelector("#backToClientButton");
const authDialog = document.querySelector("#authDialog");
const authForm = document.querySelector("#authForm");
const authName = document.querySelector("#authName");
const authEmail = document.querySelector("#authEmail");
const authCode = document.querySelector("#authCode");
const authPassword = document.querySelector("#authPassword");
const authConsent = document.querySelector("#authConsent");
const authConsentLine = document.querySelector("#authConsentLine");
const authTitle = document.querySelector("#authTitle");
const authCopy = document.querySelector("#authCopy");
const authEyebrow = document.querySelector("#authEyebrow");
const authSubmitButton = document.querySelector("#authSubmitButton");
const authSwitchButton = document.querySelector("#authSwitchButton");
const authForgotButton = document.querySelector("#authForgotButton");
const authMessage = document.querySelector("#authMessage");
const closeAuthButton = document.querySelector("#closeAuthButton");
const profileDialog = document.querySelector("#profileDialog");
const closeProfileButton = document.querySelector("#closeProfileButton");
const profileName = document.querySelector("#profileName");
const profileMeta = document.querySelector("#profileMeta");
const profileAvatarPreview = document.querySelector("#profileAvatarPreview");
const profileAvatarList = document.querySelector("#profileAvatarList");
const profileDesignsStatus = document.querySelector("#profileDesignsStatus");
const profileDesignList = document.querySelector("#profileDesignList");
const profilePreviewCamera = document.querySelector("#profilePreviewCamera");
const profilePreviewDesign = document.querySelector("#profilePreviewDesign");
const profileSourceImages = document.querySelector("#profileSourceImages");
const profileSelectionBar = document.querySelector("#profileSelectionBar");
const profileLogoutButton = document.querySelector("#profileLogoutButton");
const openPasswordPanelButton = document.querySelector("#openPasswordPanelButton");
const profileVisibilityButton = document.querySelector("#profileVisibilityButton");
const profileOrdersToggleButton = document.querySelector("#profileOrdersToggleButton");
const profileOrdersPanel = document.querySelector("#profileOrdersPanel");
const profileOrdersStatus = document.querySelector("#profileOrdersStatus");
const profileOrdersList = document.querySelector("#profileOrdersList");
const profileOrderFilters = document.querySelector("#profileOrderFilters");
const profilePasswordPanel = document.querySelector("#profilePasswordPanel");
const profileNewPassword = document.querySelector("#profileNewPassword");
const saveProfilePasswordButton = document.querySelector("#saveProfilePasswordButton");
const profilePasswordMessage = document.querySelector("#profilePasswordMessage");
const selectedDesignsCount = document.querySelector("#selectedDesignsCount");
const paySelectedDesignsButton = document.querySelector("#paySelectedDesignsButton");
const deleteSelectedDesignsButton = document.querySelector("#deleteSelectedDesignsButton");
const profileSingleActions = document.querySelector("#profileSingleActions");
const paySingleDesignButton = document.querySelector("#paySingleDesignButton");
const deleteSingleDesignButton = document.querySelector("#deleteSingleDesignButton");
const editSingleDesignButton = document.querySelector("#editSingleDesignButton");
const profileExecutorPanel = document.querySelector("#profileExecutorPanel");
const profileExecutorTitle = document.querySelector("#profileExecutorTitle");
const profileExecutorStatus = document.querySelector("#profileExecutorStatus");
const profileExecutorList = document.querySelector("#profileExecutorList");
const profileExecutorShippedToggle = document.querySelector("#profileExecutorShippedToggle");
const adminTemplateForm = document.querySelector("#adminTemplateForm");
const adminTemplateBuilderMount = document.querySelector("#adminTemplateBuilderMount");
const adminModelForm = document.querySelector("#adminModelForm");
const adminEditorSelect = document.querySelector("#adminEditorSelect");
const adminEditorNavButtons = document.querySelectorAll("[data-admin-target]");
const adminEditorSections = document.querySelectorAll("[data-admin-editor]");
const adminTemplateList = document.querySelector("#adminTemplateList");
const adminModelList = document.querySelector("#adminModelList");
const adminTemplatesStatus = document.querySelector("#adminTemplatesStatus");
const adminModelsStatus = document.querySelector("#adminModelsStatus");
const adminUserList = document.querySelector("#adminUserList");
const adminUsersStatus = document.querySelector("#adminUsersStatus");
const adminUsersMessage = document.querySelector("#adminUsersMessage");
const adminOrderUserSelect = document.querySelector("#adminOrderUserSelect");
const adminOrderModelSelect = document.querySelector("#adminOrderModelSelect");
const adminOrderDateSort = document.querySelector("#adminOrderDateSort");
const adminOrderList = document.querySelector("#adminOrderList");
const adminOrdersStatus = document.querySelector("#adminOrdersStatus");
const adminOrdersMessage = document.querySelector("#adminOrdersMessage");
const analyticsPeriodSelect = document.querySelector("#analyticsPeriodSelect");
const analyticsMessage = document.querySelector("#analyticsMessage");
const analyticsKpis = document.querySelector("#analyticsKpis");
const analyticsTrendChart = document.querySelector("#analyticsTrendChart");
const analyticsTrendCaption = document.querySelector("#analyticsTrendCaption");
const analyticsStatusChart = document.querySelector("#analyticsStatusChart");
const analyticsModelsChart = document.querySelector("#analyticsModelsChart");
const analyticsWeekdaysChart = document.querySelector("#analyticsWeekdaysChart");
const analyticsFunnelChart = document.querySelector("#analyticsFunnelChart");
const adminAvatarForm = document.querySelector("#adminAvatarForm");
const adminAvatarTitle = document.querySelector("#adminAvatarTitle");
const adminAvatarFile = document.querySelector("#adminAvatarFile");
const adminAvatarCanvas = document.querySelector("#adminAvatarCanvas");
const adminAvatarScale = document.querySelector("#adminAvatarScale");
const adminAvatarResetButton = document.querySelector("#adminAvatarResetButton");
const adminAvatarSubmitButton = document.querySelector("#adminAvatarSubmitButton");
const adminAvatarList = document.querySelector("#adminAvatarList");
const adminAvatarsStatus = document.querySelector("#adminAvatarsStatus");
const adminAvatarsMessage = document.querySelector("#adminAvatarsMessage");
const adminModelCategoryForm = document.querySelector("#adminModelCategoryForm");
const adminTemplateCategoryForm = document.querySelector("#adminTemplateCategoryForm");
const adminStickerCategoryForm = document.querySelector("#adminStickerCategoryForm");
const adminModelCategoryList = document.querySelector("#adminModelCategoryList");
const adminTemplateCategoryList = document.querySelector("#adminTemplateCategoryList");
const adminStickerCategoryList = document.querySelector("#adminStickerCategoryList");
const adminModelCategoriesStatus = document.querySelector("#adminModelCategoriesStatus");
const adminTemplateCategoriesStatus = document.querySelector("#adminTemplateCategoriesStatus");
const adminStickerCategoriesStatus = document.querySelector("#adminStickerCategoriesStatus");
const modelCategoryMessage = document.querySelector("#modelCategoryMessage");
const templateCategoryMessage = document.querySelector("#templateCategoryMessage");
const stickerCategoryMessage = document.querySelector("#stickerCategoryMessage");
const adminStickerForm = document.querySelector("#adminStickerForm");
const stickerCategorySelect = document.querySelector("#stickerCategorySelect");
const stickerSubmitButton = document.querySelector("#stickerSubmitButton");
const cancelStickerEditButton = document.querySelector("#cancelStickerEditButton");
const stickerAdminMessage = document.querySelector("#stickerAdminMessage");
const adminStickerList = document.querySelector("#adminStickerList");
const adminStickersStatus = document.querySelector("#adminStickersStatus");
let templateCategorySelect = document.querySelector("#templateCategorySelect");
let modelCategorySelectAdmin = document.querySelector("#modelCategorySelectAdmin");
const templateSubmitButton = document.querySelector("#templateSubmitButton");
const cancelTemplateEditButton = document.querySelector("#cancelTemplateEditButton");
const modelSubmitButton = document.querySelector("#modelSubmitButton");
const cancelModelEditButton = document.querySelector("#cancelModelEditButton");
const modelCornerPreset = document.querySelector("#modelCornerPreset");
const modelCornerRadiusInput = document.querySelector("#modelCornerRadiusInput");
const modelCornerRadiusOutput = document.querySelector("#modelCornerRadiusOutput");
const modelFrameWidthInput = document.querySelector("#modelFrameWidthInput");
const modelFrameWidthOutput = document.querySelector("#modelFrameWidthOutput");
const resetCameraLayoutButton = document.querySelector("#resetCameraLayoutButton");
const phoneImageInput = document.querySelector("#phoneImageInput");
const cameraImageInput = document.querySelector("#cameraImageInput");
const usePhoneAsCameraButton = document.querySelector("#usePhoneAsCameraButton");
const adminPreviewTestImageInput = document.querySelector("#adminPreviewTestImageInput");
const adminPreviewShowTestImage = document.querySelector("#adminPreviewShowTestImage");
const adminPreviewShowCamera = document.querySelector("#adminPreviewShowCamera");
const cameraOffsetXInput = document.querySelector("#cameraOffsetXInput");
const cameraOffsetYInput = document.querySelector("#cameraOffsetYInput");
const cameraScaleInput = document.querySelector("#cameraScaleInput");
const cameraOffsetXOutput = document.querySelector("#cameraOffsetXOutput");
const cameraOffsetYOutput = document.querySelector("#cameraOffsetYOutput");
const cameraScaleOutput = document.querySelector("#cameraScaleOutput");
const cameraMaskCanvas = document.querySelector("#cameraMaskCanvas");
const cameraMaskCtx = cameraMaskCanvas?.getContext("2d", { willReadFrequently: true });
const cameraToolOverlayCanvas = document.querySelector("#cameraToolOverlayCanvas");
const cameraToolOverlayCtx = cameraToolOverlayCanvas?.getContext("2d");
const maskToolMode = document.querySelector("#maskToolMode");
const maskZoomInput = document.querySelector("#maskZoomInput");
const maskZoomOutput = document.querySelector("#maskZoomOutput");
const eraserSizeInput = document.querySelector("#eraserSizeInput");
const eraserSizeOutput = document.querySelector("#eraserSizeOutput");
const eraserHardnessInput = document.querySelector("#eraserHardnessInput");
const eraserHardnessOutput = document.querySelector("#eraserHardnessOutput");
const undoEraserButton = document.querySelector("#undoEraserButton");
const redoEraserButton = document.querySelector("#redoEraserButton");
const resetEraserButton = document.querySelector("#resetEraserButton");
const protectedFrameToggle = document.querySelector("#protectedFrameToggle");
const frameThicknessInput = document.querySelector("#frameThicknessInput");
const frameThicknessOutput = document.querySelector("#frameThicknessOutput");
const frameRadiusInput = document.querySelector("#frameRadiusInput");
const frameRadiusOutput = document.querySelector("#frameRadiusOutput");
const frameColorInput = document.querySelector("#frameColorInput");
const fitFrameButton = document.querySelector("#fitFrameButton");
const cutRingButton = document.querySelector("#cutRingButton");
const toggleRingVisibilityButton = document.querySelector("#toggleRingVisibilityButton");
const toggleGapHighlightButton = document.querySelector("#toggleGapHighlightButton");
const adminModelPreview = document.querySelector("#adminModelPreview");
const adminPreviewCtx = adminModelPreview.getContext("2d");
const templateAdminMessage = document.querySelector("#templateAdminMessage");
const adminTemplateAddTextButton = document.querySelector("#adminTemplateAddTextButton");
const adminTemplateTextMessage = document.querySelector("#adminTemplateTextMessage");
const modelAdminMessage = document.querySelector("#modelAdminMessage");
let deathNoteWatchTimer = null;
let deathNoteWatchPlayId = 0;

const clientWorkspaceHome = document.createComment("client-workspace-home");
clientWorkspace?.parentElement?.insertBefore(clientWorkspaceHome, clientWorkspace);
const executorOrderList = document.querySelector("#executorOrderList");
const executorOrdersStatus = document.querySelector("#executorOrdersStatus");
const executorMessage = document.querySelector("#executorMessage");
const executorRefreshButton = document.querySelector("#executorRefreshButton");
const publicProfileDialog = document.querySelector("#publicProfileDialog");
const closePublicProfileButton = document.querySelector("#closePublicProfileButton");
const publicProfileName = document.querySelector("#publicProfileName");
const publicProfileMeta = document.querySelector("#publicProfileMeta");
const publicProfileAvatar = document.querySelector("#publicProfileAvatar");
const publicProfileDesigns = document.querySelector("#publicProfileDesigns");
const cornerCatWidget = document.querySelector("#cornerCatWidget");
const cornerCatCallout = document.querySelector("#cornerCatCallout");
const openSupportChatButton = document.querySelector("#openSupportChatButton");
const supportChatDialog = document.querySelector("#supportChatDialog");
const closeSupportChatButton = document.querySelector("#closeSupportChatButton");
const supportChatEmpty = document.querySelector("#supportChatEmpty");
const supportChatMessages = document.querySelector("#supportChatMessages");
const supportChatForm = document.querySelector("#supportChatForm");
const supportChatInput = document.querySelector("#supportChatInput");
const supportChatSendButton = document.querySelector("#supportChatSendButton");
const supportChatStatus = document.querySelector("#supportChatStatus");
const adminSupportConversationsList = document.querySelector("#adminSupportConversations");
const adminSupportStatus = document.querySelector("#adminSupportStatus");
const adminSupportRefreshButton = document.querySelector("#adminSupportRefreshButton");
const adminSupportEmpty = document.querySelector("#adminSupportEmpty");
const adminSupportMessagesList = document.querySelector("#adminSupportMessages");
const adminSupportForm = document.querySelector("#adminSupportForm");
const adminSupportInput = document.querySelector("#adminSupportInput");
const adminSupportSendButton = document.querySelector("#adminSupportSendButton");
const adminSupportMessage = document.querySelector("#adminSupportMessage");
const savedApiBase = localStorage.getItem("caseEditorApiBase");
const inferredApiBase = window.location.protocol === "file:" ? "http://localhost:3000" : "";
const configuredApiBase = window.__API_BASE__ || (window.location.protocol === "file:" ? savedApiBase || inferredApiBase : "");
const apiBase = String(configuredApiBase || "").trim().replace(/\/+$/, "");
const publicRouteDefinitions = Object.freeze({
  "/": {
    title: "Чехол со своим дизайном от 899 ₽ | ZestCaseSoul",
    description: "Создайте чехол со своими фото и надписями: выберите модель телефона, соберите дизайн онлайн и сразу посмотрите результат до заказа.",
    target: "#top"
  },
  "/constructor": {
    title: "Онлайн-конструктор чехла | ZestCaseSoul",
    description: "Выберите модель телефона, добавьте фото, стикеры или текст и сразу примерьте дизайн на чехол.",
    target: "#constructor"
  },
  "/templates": {
    title: "Готовые макеты для чехла | ZestCaseSoul",
    description: "Выберите готовый макет, адаптируйте его под свою модель телефона и добавьте личные детали.",
    target: ".templates-box",
    action: "templates"
  },
  "/models": {
    title: "Модели телефонов для чехлов | ZestCaseSoul",
    description: "Найдите свою модель телефона и проверьте доступность персонального чехла.",
    target: "#constructor",
    action: "models"
  },
  "/how-it-works": {
    title: "Как создать чехол со своим дизайном | ZestCaseSoul",
    description: "Три понятных шага: выберите модель, соберите дизайн и оформите заказ.",
    target: "#howItWorks"
  },
  "/faq": {
    title: "Вопросы о персональных чехлах | ZestCaseSoul",
    description: "Ответы о моделях телефонов, изображениях, сохранении дизайна и оформлении заказа.",
    target: "#faq"
  },
  "/about": {
    title: "О ZestCaseSoul",
    description: "ZestCaseSoul — онлайн-конструктор персональных чехлов, где результат виден до оформления заказа.",
    target: "#aboutInfo"
  },
  "/delivery": {
    title: "Доставка заказов | ZestCaseSoul",
    description: "Способы, стоимость и ориентировочные сроки изготовления и доставки персональных чехлов.",
    target: "#legalDelivery"
  },
  "/payment": {
    title: "Оплата заказа | ZestCaseSoul",
    description: "Как проходит безопасная онлайн-оплата заказа и когда чехол считается оплаченным.",
    target: "#legalPayment"
  },
  "/contacts": {
    title: "Контакты и реквизиты | ZestCaseSoul",
    description: "Контактные данные и реквизиты продавца персональных чехлов ZestCaseSoul.",
    target: "#legalContacts"
  },
  "/returns": {
    title: "Возврат и брак | ZestCaseSoul",
    description: "Как сообщить о производственном браке и оформить возврат персонального чехла.",
    target: "#legalReturns"
  },
  "/offer": {
    title: "Публичная оферта | ZestCaseSoul",
    description: "Условия дистанционной продажи и изготовления персональных чехлов ZestCaseSoul.",
    target: "#legalOffer"
  },
  "/privacy": {
    title: "Политика обработки персональных данных | ZestCaseSoul",
    description: "Какие персональные данные обрабатывает ZestCaseSoul, для каких целей и как связаться с оператором.",
    target: "#legalPrivacy"
  },
  "/login": { title: "Вход | ZestCaseSoul", description: "Войдите в аккаунт ZestCaseSoul.", action: "login" },
  "/register": { title: "Регистрация | ZestCaseSoul", description: "Создайте аккаунт ZestCaseSoul.", action: "register" },
  "/profile": { title: "Профиль | ZestCaseSoul", description: "Профиль ZestCaseSoul.", action: "profile" },
  "/designs": { title: "Мои дизайны | ZestCaseSoul", description: "Сохранённые дизайны ZestCaseSoul.", action: "designs" },
  "/orders": { title: "Мои заказы | ZestCaseSoul", description: "Заказы и их статусы в ZestCaseSoul.", action: "orders" }
});
const profileModalRoutePaths = new Set(["/profile", "/designs", "/orders"]);
const legalRoutePaths = new Set(["/contacts", "/delivery", "/returns", "/payment", "/offer", "/privacy"]);
let suppressProfileCloseRouteSync = false;

function isAbsoluteUrl(value) {
  return /^(?:https?:)?\/\//i.test(value);
}

function appUrl(value) {
  if (!value || /^(data:|blob:)/i.test(value) || isAbsoluteUrl(value)) return value;
  const normalizedPath = String(value).startsWith("/") ? String(value) : `/${value}`;
  return `${apiBase}${normalizedPath}`;
}

function apiUrl(path) {
  if (isAbsoluteUrl(path)) return path;
  const value = String(path || "");
  const apiPath = value === "/api" || value.startsWith("/api/")
    ? value
    : `/api/${value.replace(/^\/+/, "")}`;
  return appUrl(apiPath);
}

function currentPublicRoute() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const product = pathname.match(/^\/products\/([a-z0-9-]+)$/i);
  return {
    pathname,
    productSlug: product ? product[1].toLowerCase() : ""
  };
}

function isKnownPublicPath(pathname) {
  return Boolean(publicRouteDefinitions[pathname]) || /^\/products\/[a-z0-9-]+$/i.test(pathname);
}

function currentRelativeUrl() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function validProfileReturnUrl(value) {
  if (!value) return "/";
  try {
    const url = new URL(String(value), window.location.origin);
    const pathname = url.pathname.replace(/\/+$/, "") || "/";
    if (url.origin !== window.location.origin || !isKnownPublicPath(pathname) || profileModalRoutePaths.has(pathname)) return "/";
    return `${pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

function closeProfileDialogForRouteChange() {
  if (!profileDialog?.open) return;
  suppressProfileCloseRouteSync = true;
  profileDialog.close();
}

function syncRouteAfterProfileClose() {
  if (suppressProfileCloseRouteSync) {
    suppressProfileCloseRouteSync = false;
    return;
  }
  const { pathname } = currentPublicRoute();
  if (!profileModalRoutePaths.has(pathname)) return;

  const returnUrl = validProfileReturnUrl(window.history.state?.zcsProfileReturnUrl);
  if (window.history.state?.zcsProfileModalEntry && window.history.length > 1) {
    window.history.back();
    return;
  }
  navigatePublicRoute(returnUrl, { replace: true });
}

function updatePublicRouteMetadata(pathname, route) {
  document.title = route.title;
  const description = document.querySelector('meta[name="description"]');
  if (description && route.description) description.setAttribute("content", route.description);
  const canonical = document.querySelector('link[rel="canonical"]');
  const publicOrigin = /^https?:$/.test(window.location.protocol) ? window.location.origin : "https://zestcasesoul.ru";
  const canonicalUrl = `${publicOrigin}${pathname === "/" ? "/" : pathname}`;
  if (canonical) canonical.setAttribute("href", canonicalUrl);
  document.querySelector('meta[property="og:url"]')?.setAttribute("content", canonicalUrl);
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", route.title.replace(/ \| ZestCaseSoul$/, ""));
}

function syncPublicRouteView(pathname) {
  const isLegalRoute = legalRoutePaths.has(pathname);
  marketingHero?.classList.toggle("hidden", isLegalRoute);
  storefrontContent?.classList.toggle("hidden", isLegalRoute);
  legalContent?.classList.toggle("hidden", !isLegalRoute);
  legalDocuments.forEach((documentSection) => {
    documentSection.classList.toggle("hidden", documentSection.dataset.legalPage !== pathname);
  });
}

async function runPublicRouteAction(action) {
  if (!action) return;
  if (action === "login" || action === "register") {
    if (currentUser) {
      await openProfile();
      return;
    }
    openAuth(action);
    return;
  }
  if (action === "models") {
    openModelPickerButton?.click();
    return;
  }
  if (action === "templates") {
    if (window.matchMedia("(max-width: 860px)").matches) {
      document.querySelector('[data-editor-tool="templates"]')?.click();
    }
    return;
  }
  if (["profile", "designs", "orders"].includes(action)) {
    if (!currentUser) {
      openAuth("login");
      return;
    }
    await openProfile();
    if (action === "orders") await toggleProfileOrders({ open: true });
  }
}

function applyPublicRoute({ behavior = "auto", runAction = true } = {}) {
  const { pathname, productSlug } = currentPublicRoute();
  let route = publicRouteDefinitions[pathname];
  if (!route && productSlug) {
    route = {
      title: "Чехол для выбранной модели | ZestCaseSoul",
      description: "Создайте персональный чехол для выбранной модели телефона.",
      target: "#constructor"
    };
  }
  if (!route) return false;
  if (!profileModalRoutePaths.has(pathname)) closeProfileDialogForRouteChange();
  syncPublicRouteView(pathname);

  if (productSlug) {
    const modelIndex = models.findIndex((model) => String(model.slug || "").toLowerCase() === productSlug);
    if (modelIndex >= 0) {
      modelSelect.value = String(modelIndex);
      currentModel = models[modelIndex];
      updateModelPickerButton();
      render();
      route = {
        ...route,
        title: `Чехол для ${currentModel.name} | ZestCaseSoul`,
        description: `Создайте чехол со своим дизайном для ${currentModel.name} и сразу посмотрите результат онлайн.`
      };
    } else if (stockNotice) {
      stockNotice.classList.remove("hidden");
      stockNotice.textContent = "Эта модель не найдена. Выберите доступную модель из каталога.";
      route = { ...route, title: "Модель не найдена | ZestCaseSoul", action: "models" };
    }
  }

  updatePublicRouteMetadata(pathname, route);
  requestAnimationFrame(() => {
    const targetSelector = route.action === "templates" && window.matchMedia("(max-width: 860px)").matches
      ? "#constructor"
      : route.target;
    const target = targetSelector ? document.querySelector(targetSelector) : null;
    target?.scrollIntoView({ block: "start", behavior });
    if (runAction) window.setTimeout(() => runPublicRouteAction(route.action), behavior === "smooth" ? 240 : 0);
  });
  return true;
}

function navigatePublicRoute(path, { replace = false } = {}) {
  const url = new URL(path, window.location.href);
  if (url.origin !== window.location.origin) return false;
  const normalizedPath = url.pathname.replace(/\/+$/, "") || "/";
  const isKnownRoute = isKnownPublicPath(normalizedPath);
  if (!isKnownRoute) return false;
  const nextUrl = `${normalizedPath}${url.search}${url.hash}`;
  const currentRoute = currentPublicRoute();
  const historyState = profileModalRoutePaths.has(normalizedPath)
    ? {
      zcsProfileModalEntry: !replace,
      zcsProfileReturnUrl: profileModalRoutePaths.has(currentRoute.pathname)
        ? validProfileReturnUrl(window.history.state?.zcsProfileReturnUrl)
        : validProfileReturnUrl(currentRelativeUrl())
    }
    : {};
  window.history[replace ? "replaceState" : "pushState"](historyState, "", nextUrl);
  return applyPublicRoute({ behavior: "smooth" });
}

window.caseEditorRouter = Object.freeze({ navigate: navigatePublicRoute, apply: applyPublicRoute });

document.addEventListener("click", (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest("a[data-route]");
  if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin) return;
  if (!navigatePublicRoute(`${url.pathname}${url.search}${url.hash}`)) return;
  event.preventDefault();
});

window.addEventListener("popstate", () => applyPublicRoute());

function displayImageUrl(src) {
  return appUrl(src);
}

function ensureCategoryControls() {
  if (adminEditorSelect && ![...adminEditorSelect.options].some((option) => option.value === "modelCategories")) {
    adminEditorSelect.insertBefore(new Option("Категории моделей", "modelCategories"), adminEditorSelect.firstChild);
    const templatesOption = [...adminEditorSelect.options].find((option) => option.value === "templates");
    adminEditorSelect.insertBefore(new Option("Категории макетов", "templateCategories"), templatesOption || null);
  }
  if (adminEditorSelect && ![...adminEditorSelect.options].some((option) => option.value === "stickerCategories")) {
    const stickersOption = [...adminEditorSelect.options].find((option) => option.value === "stickers");
    adminEditorSelect.insertBefore(new Option("Категории стикеров", "stickerCategories"), stickersOption || null);
  }
  if (adminTemplateForm && !templateCategorySelect) {
    templateCategorySelect = document.createElement("select");
    templateCategorySelect.id = "templateCategorySelect";
    templateCategorySelect.name = "categoryId";
    adminTemplateForm.insertBefore(templateCategorySelect, adminTemplateForm.querySelector("#templateTitle") || adminTemplateForm.firstElementChild?.nextSibling);
  }
  if (adminModelForm && !modelCategorySelectAdmin) {
    modelCategorySelectAdmin = document.createElement("select");
    modelCategorySelectAdmin.id = "modelCategorySelectAdmin";
    modelCategorySelectAdmin.name = "categoryId";
    adminModelForm.insertBefore(modelCategorySelectAdmin, adminModelForm.querySelector('input[name="name"]'));
  }
}

function fillCategorySelect(select, categories, placeholder = "Без категории", selectedValue = "") {
  if (!select) return;
  const current = selectedValue || select.value || "";
  select.innerHTML = "";
  select.append(new Option(placeholder, ""));
  categories.forEach((category) => {
    select.append(new Option(`${category.name}${category.itemsCount ? ` (${category.itemsCount})` : ""}`, String(category.id)));
  });
  select.value = [...select.options].some((option) => option.value === String(current)) ? String(current) : "";
}

function ensureModelPicker() {
  if (modelPickerDialog) return;
  openModelPickerButton = document.createElement("button");
  openModelPickerButton.type = "button";
  openModelPickerButton.className = "model-picker-open";
  openModelPickerButton.innerHTML = `<span>Модель</span><strong>${currentModel?.name || "Выбрать модель"}</strong>`;
  const modelField = modelSelect?.closest(".field");
  modelField?.classList.add("legacy-model-control");
  modelCategorySelect?.closest(".field")?.classList.add("legacy-model-control");
  modelSearchInput?.closest(".field")?.classList.add("legacy-model-control");
  modelField?.parentElement?.insertBefore(openModelPickerButton, modelField);

  modelPickerDialog = document.createElement("dialog");
  modelPickerDialog.className = "model-picker-dialog";
  modelPickerDialog.innerHTML = `
    <section class="model-picker-card">
      <button class="model-picker-close" type="button" aria-label="Закрыть">×</button>
      <h2>Выбор модели</h2>
      <input class="model-picker-search" type="search" placeholder="поиск модели">
      <div class="model-picker-current"></div>
      <div class="model-picker-layout">
        <nav class="model-picker-categories" aria-label="Категории моделей"></nav>
        <div class="model-picker-models" aria-label="Модели"></div>
      </div>
    </section>
  `;
  document.body.append(modelPickerDialog);
  modelPickerSearchInput = modelPickerDialog.querySelector(".model-picker-search");
  modelPickerCategoryList = modelPickerDialog.querySelector(".model-picker-categories");
  modelPickerModelList = modelPickerDialog.querySelector(".model-picker-models");
  modelPickerCurrent = modelPickerDialog.querySelector(".model-picker-current");

  openModelPickerButton.addEventListener("click", async () => {
    modelPickerCategoryId = selectedModelCategoryId || currentModel?.categoryId || phoneModelCategories.find((item) => item.itemsCount > 0)?.id || phoneModelCategories[0]?.id || "";
    modelPickerSearchInput.value = "";
    await loadModelPickerModels();
    renderModelPicker();
    if (typeof modelPickerDialog.showModal === "function") modelPickerDialog.showModal();
    else modelPickerDialog.setAttribute("open", "");
    modelPickerSearchInput.focus();
  });
  modelPickerDialog.querySelector(".model-picker-close")?.addEventListener("click", () => modelPickerDialog.close());
  modelPickerSearchInput.addEventListener("input", () => {
    window.clearTimeout(modelPickerSearchTimer);
    modelPickerSearchTimer = window.setTimeout(async () => {
      await loadModelPickerModels();
      renderModelPicker();
    }, 180);
  });
}

function updateModelPickerButton() {
  if (!openModelPickerButton) return;
  openModelPickerButton.querySelector("strong").textContent = currentModel?.name || "Выбрать модель";
}

async function loadModelPickerModels() {
  try {
    await fetchModelCatalog();
    const search = String(modelPickerSearchInput?.value || "").trim().toLowerCase();
    modelPickerModels = modelCatalog.filter((model) => {
      if (modelPickerCategoryId && String(model.categoryId || "") !== String(modelPickerCategoryId)) return false;
      return !search || String(model.name || "").toLowerCase().includes(search);
    });
  } catch {
    modelPickerModels = [];
  }
}

function renderModelPicker() {
  if (!modelPickerDialog) return;
  modelPickerCurrent.textContent = currentModel?.name ? `Сейчас выбрано: ${currentModel.name}` : "";
  modelPickerCategoryList.innerHTML = "";
  phoneModelCategories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `model-picker-category${String(category.id) === String(modelPickerCategoryId) ? " is-active" : ""}`;
    button.textContent = category.name;
    button.addEventListener("click", async () => {
      modelPickerCategoryId = String(category.id);
      modelPickerSearchInput.value = "";
      await loadModelPickerModels();
      renderModelPicker();
    });
    modelPickerCategoryList.append(button);
  });

  modelPickerModelList.innerHTML = "";
  if (!modelPickerModels.length) {
    const empty = document.createElement("p");
    empty.className = "model-picker-empty";
    empty.textContent = "Модели не найдены";
    modelPickerModelList.append(empty);
    return;
  }
  modelPickerModels.forEach((model) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `model-picker-model${Number(model.id) === Number(currentModel?.id) ? " is-active" : ""}`;
    button.textContent = model.name;
    button.addEventListener("click", async () => {
      selectedModelCategoryId = model.categoryId ? String(model.categoryId) : "";
      if (modelCategorySelect) modelCategorySelect.value = selectedModelCategoryId;
      if (modelSearchInput) modelSearchInput.value = "";
      await loadModels();
      selectModelById(model.id);
      currentModel = models[Number(modelSelect.value)] || model;
      render();
      updateModelPickerButton();
      modelPickerDialog.close();
    });
    modelPickerModelList.append(button);
  });
}

function renderCategoryPicker(container, categories, selectedId, onSelect) {
  if (!container) return;
  container.innerHTML = "";
  if (!categories.length) {
    const empty = document.createElement("p");
    empty.className = "admin-empty";
    empty.textContent = "Категорий пока нет.";
    container.append(empty);
    return;
  }
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `category-chip${String(category.id) === String(selectedId) ? " is-active" : ""}`;
    button.textContent = category.name;
    button.addEventListener("click", () => onSelect(category.id));
    container.append(button);
  });
}

function renderPublicCategoryControls() {
  fillCategorySelect(modelCategorySelect, phoneModelCategories, "Выберите категорию", selectedModelCategoryId);
  renderCategoryPicker(templateCategoryPicker, templateCategories.filter((category) => category.itemsCount > 0), selectedTemplateCategoryId, async (id) => {
    selectedTemplateCategoryId = String(id);
    await loadTemplates();
  });
  renderCategoryPicker(stickerCategoryPicker, stickerCategories.filter((category) => category.itemsCount > 0), selectedStickerCategoryId, (id) => {
    selectedStickerCategoryId = String(id);
    applyStickerCatalogFilters();
  });
}

function renderAdminCategoryControls() {
  fillCategorySelect(modelCategorySelectAdmin, adminPhoneModelCategories, "Категория модели");
  fillCategorySelect(templateCategorySelect, adminTemplateCategories, "Категория макета");
  fillCategorySelect(stickerCategorySelect, adminStickerCategories, "Категория стикера");
  renderAdminCategoryLists();
}

async function loadCategories({ force = false } = {}) {
  ensureCategoryControls();
  if (!force && publicCategoriesLoaded) {
    renderPublicCategoryControls();
    return;
  }
  if (publicCategoriesRequest) return publicCategoriesRequest;

  publicCategoriesRequest = (async () => {
    const cache = force ? "no-cache" : "default";
    const fetchCategoryList = async (endpoint) => {
      const response = await fetch(apiUrl(endpoint), { cache });
      if (!response.ok) throw new Error("Не удалось загрузить категории.");
      return response.json();
    };
    const [modelResult, templateResult, stickerResult] = await Promise.allSettled([
      fetchCategoryList("/api/phone-model-categories"),
      fetchCategoryList("/api/template-categories"),
      fetchCategoryList("/api/sticker-categories")
    ]);
    if (modelResult.status === "fulfilled") phoneModelCategories = modelResult.value;
    if (templateResult.status === "fulfilled") templateCategories = templateResult.value;
    if (stickerResult.status === "fulfilled") stickerCategories = stickerResult.value;
    publicCategoriesLoaded = [modelResult, templateResult, stickerResult].every((result) => result.status === "fulfilled");
    renderPublicCategoryControls();
  })().finally(() => {
    publicCategoriesRequest = null;
  });
  return publicCategoriesRequest;
}

async function loadAdminCategories({ force = false, type = "all" } = {}) {
  ensureCategoryControls();
  if (!currentUser || currentUser.role !== "admin") return;
  const types = type === "all" ? ["models", "templates", "stickers"] : [type];
  await Promise.all(types.map(async (categoryType) => {
    const state = adminCategoryState[categoryType];
    if (!state) return;
    if (!force && state.loaded) return;
    if (state.request) return state.request;
    const endpoint = categoryType === "models"
      ? "/api/admin/phone-model-categories"
      : categoryType === "templates"
        ? "/api/admin/template-categories"
        : "/api/admin/sticker-categories";
    let request;
    request = adminRequest(endpoint, { cache: "no-store" })
      .then((rows) => {
        if (categoryType === "models") adminPhoneModelCategories = rows;
        else if (categoryType === "templates") adminTemplateCategories = rows;
        else adminStickerCategories = rows;
        state.loaded = true;
      })
      .finally(() => {
        if (state.request === request) state.request = null;
      });
    state.request = request;
    return request;
  })).catch((error) => {
    if (modelCategoryMessage) modelCategoryMessage.textContent = error.message || "Не удалось загрузить категории админки.";
  });
  renderAdminCategoryControls();
}

function readJsonCache(key, fallbackValue = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function writeJsonCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors; the live API response is still the source of truth.
  }
}

function removeCache(key) {
  try {
    localStorage.removeItem(key);
  } catch {
  }
}

function decodeTokenPayload(token) {
  try {
    const payload = String(token || "").split(".")[0];
    if (!payload) return null;
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function hasUsableStoredToken(token) {
  const payload = decodeTokenPayload(token);
  return Boolean(token && payload?.userId && Number(payload.exp || 0) > Date.now() + 5000);
}

function storeSession(token, user) {
  if (token) localStorage.setItem(tokenKey, token);
  if (user) writeJsonCache(sessionUserKey, user);
}

function clearStoredSession() {
  localStorage.removeItem(tokenKey);
  removeCache(sessionUserKey);
}

function restoreCachedSession() {
  const token = localStorage.getItem(tokenKey);
  const cachedUser = readJsonCache(sessionUserKey);
  if (!hasUsableStoredToken(token)) {
    clearStoredSession();
    return false;
  }
  if (!cachedUser) return false;
  currentUser = cachedUser;
  bindSupportIdentityToUser(cachedUser);
  updateAuthUi();
  return true;
}

function profileDesignsCacheKey() {
  return currentUser?.id ? `${profileDesignsCachePrefix}${currentUser.id}` : null;
}

function clearPrivateClientState() {
  const cacheKey = profileDesignsCacheKey();
  if (cacheKey) removeCache(cacheKey);
  savedDesigns = [];
  designDetailCache.clear();
  selectedProfileDesignIds = new Set();
  activeProfileDesignId = null;
  profileOrders = [];
  profileOrderFilter = "all";
  executorOrders = [];
  adminOrders = [];
  adminUsers = [];
}

function decorateImage(image, { lazy = true } = {}) {
  if (!image) return image;
  image.decoding = "async";
  if (lazy) image.loading = "lazy";
  return image;
}

function preloadImages(urls, limit = 6) {
  const work = () => {
    urls.filter(Boolean).slice(0, limit).forEach((src) => {
      const image = new Image();
      image.decoding = "async";
      image.src = displayImageUrl(src);
    });
  };
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(work, { timeout: 1500 });
  } else {
    window.setTimeout(work, 250);
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);
}

function updateRangeOutputs() {
  if (modelCornerRadiusOutput) modelCornerRadiusOutput.textContent = `${modelCornerRadiusInput?.value || 0} px`;
  if (modelFrameWidthOutput) modelFrameWidthOutput.textContent = `${modelFrameWidthInput?.value || 0} px`;
  if (maskZoomOutput) maskZoomOutput.textContent = `${maskZoomInput?.value || 100}%`;
  if (eraserSizeOutput) eraserSizeOutput.textContent = `${eraserSizeInput?.value || 34} px`;
  if (eraserHardnessOutput) eraserHardnessOutput.textContent = `${eraserHardnessInput?.value || 82}%`;
  if (frameThicknessOutput) frameThicknessOutput.textContent = `${frameThicknessInput?.value || 4} px`;
  if (frameRadiusOutput) frameRadiusOutput.textContent = `${frameRadiusInput?.value || 24} px`;
  if (cameraOffsetXOutput) cameraOffsetXOutput.textContent = `${cameraOffsetXInput?.value || 0} px`;
  if (cameraOffsetYOutput) cameraOffsetYOutput.textContent = `${cameraOffsetYInput?.value || 0} px`;
  if (cameraScaleOutput) cameraScaleOutput.textContent = `${cameraScaleInput?.value || 100}%`;
}

function showAdminEditor(editorName = "models") {
  if (editorName !== "messages") stopAdminSupportPolling();
  adminEditorSections.forEach((section) => {
    section.classList.toggle("hidden", section.dataset.adminEditor !== editorName);
  });
  if (adminEditorSelect) adminEditorSelect.value = editorName;
  adminEditorNavButtons.forEach((button) => {
    const isActive = button.dataset.adminTarget === editorName;
    button.classList.toggle("is-active", isActive);
    if (isActive) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  syncTemplateBuilderWorkspace(editorName);
  if (editorName === "models" || editorName === "modelCategories") loadAdminCategories({ type: "models" });
  if (editorName === "templates" || editorName === "templateCategories") loadAdminCategories({ type: "templates" });
  if (editorName === "stickers" || editorName === "stickerCategories") loadAdminCategories({ type: "stickers" });
  if (editorName === "templates") loadTemplates();
  if (editorName === "stickers") {
    loadStickers();
    loadAdminStickers();
  }
  if (editorName === "models") loadAdminModels();
  if (editorName === "users") loadAdminUsers();
  if (editorName === "orders") loadAdminOrdersPanel();
  if (editorName === "analytics") loadAdminAnalytics();
  if (editorName === "avatars") loadAdminAvatars();
  if (editorName === "messages") {
    loadAdminSupportConversations({ selectFirst: true });
    startAdminSupportPolling();
  }
}

function syncTemplateBuilderWorkspace(editorName = adminEditorSelect?.value || "") {
  if (!clientWorkspace || !adminTemplateBuilderMount || !clientWorkspaceHome.parentNode) return;
  const shouldMountInAdmin = currentUser?.role === "admin" && !adminView.classList.contains("hidden") && editorName === "templates";
  const wasTemplateBuilder = clientWorkspace.classList.contains("template-builder-workspace");

  if (shouldMountInAdmin) {
    if (clientWorkspace.parentElement !== adminTemplateBuilderMount) adminTemplateBuilderMount.append(clientWorkspace);
    clientWorkspace.classList.add("template-builder-workspace");
    if (adminTemplateForm?.elements.image) adminTemplateForm.elements.image.required = false;
  } else {
    const home = clientWorkspaceHome.parentNode;
    if (clientWorkspace.parentElement !== home) home.insertBefore(clientWorkspace, clientWorkspaceHome.nextSibling);
    clientWorkspace.classList.remove("template-builder-workspace");
    if (wasTemplateBuilder) window.dispatchEvent(new CustomEvent("case-editor:close-tool-editor"));
  }
  render();
}

function updateMaskCanvasDisplay() {
  if (!cameraMaskCanvas) return;
  maskZoom = Number(maskZoomInput?.value || 100) / 100;
  const target = cameraMaskCanvas.parentElement;
  const baseWidth = Math.max(260, target?.clientWidth || cameraMaskCanvas.width || 420);
  const displayWidth = Math.round(baseWidth * maskZoom);
  const displayHeight = Math.round(displayWidth * (cameraMaskCanvas.height / Math.max(1, cameraMaskCanvas.width)));
  if (!target) return;
  target.style.setProperty("--mask-display-width", `${displayWidth}px`);
  target.style.setProperty("--mask-display-height", `${displayHeight}px`);
}

function changeMaskZoom(delta) {
  if (!maskZoomInput) return;
  const min = Number(maskZoomInput.min || 80);
  const max = Number(maskZoomInput.max || 300);
  const nextValue = clamp(Number(maskZoomInput.value || 100) + delta, min, max);
  maskZoomInput.value = String(nextValue);
  updateMaskCanvasDisplay();
  updateRangeOutputs();
}

function makeTemplateSvg(primary, secondary, label) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 960">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${primary}"/><stop offset="1" stop-color="${secondary}"/></linearGradient><filter id="blur"><feGaussianBlur stdDeviation="32"/></filter></defs>
      <rect width="720" height="960" fill="url(#g)"/>
      <circle cx="140" cy="170" r="140" fill="rgba(255,255,255,.32)" filter="url(#blur)"/>
      <circle cx="590" cy="760" r="190" fill="rgba(255,255,255,.22)" filter="url(#blur)"/>
      <path d="M-80 620 C120 500 280 760 470 610 C600 505 690 550 800 480 L800 960 L-80 960Z" fill="rgba(255,255,255,.28)"/>
      <text x="360" y="498" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="800" fill="rgba(255,255,255,.82)">${label}</text>
    </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function authHeaders() {
  const token = localStorage.getItem(tokenKey);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function setViewForRole(role, forceClient = false) {
  const isAdmin = role === "admin" && !forceClient;
  const isExecutor = role === "executor" && !forceClient;
  clientView.classList.toggle("hidden", isAdmin || isExecutor);
  adminView.classList.toggle("hidden", !isAdmin);
  executorView?.classList.toggle("hidden", !isExecutor);
  if (isAdmin) showAdminEditor(adminEditorSelect?.value || "models");
  if (!isAdmin) {
    stopAdminSupportPolling();
    syncTemplateBuilderWorkspace("");
  }
  if (isExecutor) loadExecutorOrders();
}

function updateAuthUi() {
  guestActions.classList.toggle("hidden", Boolean(currentUser));
  userActions.classList.toggle("hidden", !currentUser);
  if (currentUser) {
    userBadge.textContent = `${currentUser.name} · ${roleLabel(currentUser.role)}`;
    setAvatarPreview(openProfileButton, currentUser.avatarUrl, currentUser.name?.slice(0, 1) || "?");
    openAdminButton.classList.toggle("hidden", currentUser.role !== "admin");
    setViewForRole(currentUser.role);
  } else {
    if (openProfileButton) openProfileButton.textContent = "👤";
    openAdminButton.classList.add("hidden");
    setViewForRole("client", true);
  }
}

function setAuthMode(mode) {
  authMode = mode;
  const isRegister = mode === "register";
  const isLogin = mode === "login";
  const isForgot = mode === "forgot";
  const isReset = mode === "reset";
  const isVerify = mode === "verify";

  authName.classList.toggle("hidden", !isRegister);
  authCode.classList.toggle("hidden", !isVerify);
  authEmail.classList.toggle("hidden", isReset);
  authPassword.classList.toggle("hidden", isForgot || isVerify);
  authName.required = isRegister;
  authEmail.required = !isReset;
  authCode.required = isVerify;
  authPassword.required = !(isForgot || isVerify);
  if (authConsent && authConsentLine) {
    authConsentLine.classList.toggle("hidden", !isRegister);
    authConsent.required = isRegister;
    authConsent.disabled = !isRegister;
  }

  if (isRegister) {
    authEyebrow.textContent = "Регистрация";
    authTitle.textContent = "Создать аккаунт";
    authCopy.textContent = "После регистрации мы отправим код для подтверждения почты.";
    authSubmitButton.textContent = "Зарегистрироваться";
    authSwitchButton.textContent = "Уже есть аккаунт? Войти";
  }

  if (isLogin) {
    authEyebrow.textContent = "Вход";
    authTitle.textContent = "Войти в аккаунт";
    authCopy.textContent = "После входа мы проверим роль и откроем нужный редактор.";
    authSubmitButton.textContent = "Войти";
    authSwitchButton.textContent = "Нет аккаунта? Зарегистрироваться";
  }

  if (isForgot) {
    authEyebrow.textContent = "Восстановление";
    authTitle.textContent = "Восстановить пароль";
    authCopy.textContent = "Введите email, и мы отправим ссылку для создания нового пароля.";
    authSubmitButton.textContent = "Отправить письмо";
    authSwitchButton.textContent = "Вернуться ко входу";
  }

  if (isReset) {
    authEyebrow.textContent = "Новый пароль";
    authTitle.textContent = "Задать новый пароль";
    authCopy.textContent = "Введите новый пароль для аккаунта.";
    authSubmitButton.textContent = "Обновить пароль";
    authSwitchButton.textContent = "Вернуться ко входу";
  }

  if (isVerify) {
    authEyebrow.textContent = "Подтверждение";
    authTitle.textContent = "Введите код из письма";
    authCopy.textContent = "Мы отправили 6 цифр на вашу почту. Код действует 15 минут.";
    authSubmitButton.textContent = "Подтвердить почту";
    authSwitchButton.textContent = "Вернуться ко входу";
  }

  authForgotButton.classList.toggle("hidden", !isLogin);
  authMessage.textContent = "";
}

function openAuth(mode = "register") {
  setAuthMode(mode);
  authForm.reset();
  if (typeof authDialog.showModal === "function") {
    authDialog.showModal();
  } else {
    authDialog.setAttribute("open", "");
  }
}

async function authRequest(path, payload) {
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const contentType = response.headers.get("content-type") || "";
  const result = contentType.includes("application/json")
    ? await response.json()
    : { raw: await response.text() };
  if (!response.ok) {
    if (result.raw && result.raw.trim().startsWith("<!DOCTYPE")) {
      throw new Error("Сервер вернул HTML вместо JSON. Проверьте, что ngrok проксирует именно Node-сервер с API.");
    }
    const error = new Error(result.error || "Ошибка авторизации");
    error.details = result;
    throw error;
  }

  if (!result.token || !result.user) {
    return result;
  }

  bindSupportIdentityToUser(result.user);
  storeSession(result.token, result.user);
  currentUser = result.user;
  updateAuthUi();
  authDialog.close();
  if (pendingProfileSaveAfterAuth) {
    pendingProfileSaveAfterAuth = false;
    setViewForRole("client", true);
    window.setTimeout(() => openSaveChoiceDialog("Вход выполнен. Теперь дизайн можно сохранить в профиль."), 0);
  }
  return result;
}

async function adminRequest(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {})
    }
  });
  const contentType = response.headers.get("content-type") || "";
  const result = contentType.includes("application/json")
    ? await response.json()
    : { raw: await response.text() };

  if (!response.ok) {
    throw new Error(result.error || "Ошибка админ-панели");
  }

  return result;
}

function supportGuestToken() {
  const stored = localStorage.getItem(supportGuestTokenKey);
  if (/^[a-f0-9]{48}$/.test(stored || "")) return stored;
  const bytes = new Uint8Array(24);
  window.crypto.getRandomValues(bytes);
  const token = [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
  localStorage.setItem(supportGuestTokenKey, token);
  return token;
}

async function supportRequest(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      ...authHeaders(),
      "X-Chat-Token": supportGuestToken(),
      ...(options.headers || {})
    }
  });
  const contentType = response.headers.get("content-type") || "";
  const result = contentType.includes("application/json")
    ? await response.json()
    : { raw: await response.text() };
  if (!response.ok) throw new Error(result.error || "Не удалось открыть чат.");
  return result;
}

function supportTimeLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function renderSupportMessageList(messages, container, ownSender) {
  if (!container) return;
  const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 90;
  container.innerHTML = "";
  messages.forEach((message) => {
    const item = document.createElement("article");
    item.className = `support-message${message.senderType === ownSender ? " is-own" : ""}`;
    const body = document.createElement("p");
    body.textContent = message.body;
    const time = document.createElement("time");
    time.dateTime = message.createdAt || "";
    time.textContent = supportTimeLabel(message.createdAt);
    item.append(body, time);
    container.append(item);
  });
  if (nearBottom || messages.length <= 2) container.scrollTop = container.scrollHeight;
}

function mergeSupportMessages(current, incoming) {
  const messagesById = new Map(current.map((message) => [Number(message.id), message]));
  incoming.forEach((message) => messagesById.set(Number(message.id), message));
  return [...messagesById.values()].sort((left, right) => Number(left.id) - Number(right.id));
}

function renderCustomerSupportChat() {
  const hasMessages = supportMessages.length > 0;
  supportChatEmpty?.classList.toggle("hidden", hasMessages);
  supportChatMessages?.classList.toggle("hidden", !hasMessages);
  if (hasMessages) renderSupportMessageList(supportMessages, supportChatMessages, "customer");
}

async function loadSupportMessages({ reset = false, silent = false } = {}) {
  if (supportLoadRequest) return supportLoadRequest;
  const after = reset ? 0 : supportLastMessageId;
  supportLoadRequest = (async () => {
    try {
      const result = await supportRequest(`/api/support/messages?after=${after}`, { cache: "no-store" });
      if (reset) supportMessages = [];
      supportMessages = mergeSupportMessages(supportMessages, result.messages || []);
      supportLastMessageId = supportMessages.reduce((maximum, message) => Math.max(maximum, Number(message.id) || 0), 0);
      renderCustomerSupportChat();
      if (!silent && supportChatStatus) supportChatStatus.textContent = "";
      return supportMessages;
    } catch (error) {
      if (!silent && supportChatStatus) supportChatStatus.textContent = error.message;
      return supportMessages;
    }
  })().finally(() => {
    supportLoadRequest = null;
  });
  return supportLoadRequest;
}

function startSupportPolling() {
  stopSupportPolling();
  supportPollTimer = window.setInterval(() => {
    if (supportChatDialog?.open && document.visibilityState === "visible") {
      loadSupportMessages({ silent: true });
    }
  }, 15_000);
}

function stopSupportPolling() {
  if (!supportPollTimer) return;
  window.clearInterval(supportPollTimer);
  supportPollTimer = null;
}

async function openSupportChat() {
  cornerCatWidget?.classList.add("is-chat-open");
  if (cornerCatCallout) cornerCatCallout.hidden = true;
  openSupportChatButton?.removeAttribute("aria-describedby");
  if (typeof supportChatDialog?.showModal === "function") supportChatDialog.showModal();
  else supportChatDialog?.setAttribute("open", "");
  if (supportChatStatus) supportChatStatus.textContent = "Загружаю сообщения...";
  await loadSupportMessages({ reset: true });
  startSupportPolling();
  supportChatInput?.focus();
}

function closeSupportChat() {
  stopSupportPolling();
  cornerCatWidget?.classList.remove("is-chat-open");
  if (supportChatDialog?.open && typeof supportChatDialog.close === "function") supportChatDialog.close();
  else supportChatDialog?.removeAttribute("open");
}

function resetSupportChatIdentity() {
  stopSupportPolling();
  localStorage.removeItem(supportGuestTokenKey);
  localStorage.removeItem(supportGuestOwnerKey);
  supportMessages = [];
  supportLastMessageId = 0;
  renderCustomerSupportChat();
}

function bindSupportIdentityToUser(user) {
  const userId = String(user?.id || "");
  if (!userId) return;
  const currentOwner = localStorage.getItem(supportGuestOwnerKey);
  if (currentOwner && currentOwner !== userId) resetSupportChatIdentity();
  localStorage.setItem(supportGuestOwnerKey, userId);
}

async function sendCustomerSupportMessage() {
  const body = String(supportChatInput?.value || "").trim();
  if (!body) return;
  supportChatSendButton.disabled = true;
  if (supportChatStatus) supportChatStatus.textContent = "Отправляю...";
  try {
    const result = await supportRequest("/api/support/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: body })
    });
    supportMessages = mergeSupportMessages(supportMessages, [result.message]);
    supportLastMessageId = Math.max(supportLastMessageId, Number(result.message?.id) || 0);
    supportChatInput.value = "";
    renderCustomerSupportChat();
    if (supportChatStatus) supportChatStatus.textContent = "Сообщение отправлено.";
  } catch (error) {
    if (supportChatStatus) supportChatStatus.textContent = error.message;
  } finally {
    supportChatSendButton.disabled = false;
    supportChatInput?.focus();
  }
}

function renderAdminSupportConversations() {
  if (!adminSupportConversationsList) return;
  adminSupportConversationsList.innerHTML = "";
  const unreadTotal = adminSupportConversations.reduce((sum, conversation) => sum + Number(conversation.adminUnreadCount || 0), 0);
  if (adminSupportStatus) {
    adminSupportStatus.textContent = `${adminSupportConversations.length} ${adminSupportConversations.length === 1 ? "чат" : "чатов"}${unreadTotal ? ` · ${unreadTotal} новых` : ""}`;
  }
  if (!adminSupportConversations.length) {
    const empty = document.createElement("p");
    empty.className = "admin-list-empty";
    empty.textContent = "Новых сообщений пока нет.";
    adminSupportConversationsList.append(empty);
    return;
  }
  adminSupportConversations.forEach((conversation) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `admin-support-conversation${Number(conversation.id) === Number(activeAdminSupportConversationId) ? " is-active" : ""}`;
    const heading = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = conversation.customerName || "Гость сайта";
    heading.append(name);
    if (Number(conversation.adminUnreadCount || 0) > 0) {
      const unread = document.createElement("span");
      unread.className = "admin-support-unread";
      unread.textContent = String(conversation.adminUnreadCount);
      heading.append(unread);
    }
    const preview = document.createElement("small");
    preview.textContent = conversation.lastMessage || "Новый чат";
    const time = document.createElement("small");
    time.textContent = supportTimeLabel(conversation.lastMessageAt || conversation.createdAt);
    button.append(heading, preview, time);
    button.addEventListener("click", async () => {
      activeAdminSupportConversationId = Number(conversation.id);
      adminSupportMessages = [];
      adminSupportLastMessageId = 0;
      renderAdminSupportConversations();
      await loadAdminSupportMessages({ reset: true });
      loadAdminSupportConversations({ silent: true });
    });
    adminSupportConversationsList.append(button);
  });
}

function renderAdminSupportThread() {
  const hasConversation = Boolean(activeAdminSupportConversationId);
  adminSupportEmpty?.classList.toggle("hidden", hasConversation);
  adminSupportMessagesList?.classList.toggle("hidden", !hasConversation);
  adminSupportForm?.classList.toggle("hidden", !hasConversation);
  if (hasConversation) renderSupportMessageList(adminSupportMessages, adminSupportMessagesList, "admin");
}

async function loadAdminSupportMessages({ reset = false, silent = false } = {}) {
  if (!activeAdminSupportConversationId || adminSupportMessagesRequest) return adminSupportMessagesRequest;
  const conversationId = activeAdminSupportConversationId;
  const after = reset ? 0 : adminSupportLastMessageId;
  adminSupportMessagesRequest = (async () => {
    try {
      const result = await adminRequest(`/api/admin/support/conversations/${conversationId}/messages?after=${after}`, { cache: "no-store" });
      if (Number(activeAdminSupportConversationId) !== Number(conversationId)) return;
      if (reset) adminSupportMessages = [];
      adminSupportMessages = mergeSupportMessages(adminSupportMessages, result.messages || []);
      adminSupportLastMessageId = adminSupportMessages.reduce((maximum, message) => Math.max(maximum, Number(message.id) || 0), 0);
      const activeConversation = adminSupportConversations.find((conversation) => Number(conversation.id) === Number(conversationId));
      if (activeConversation) activeConversation.adminUnreadCount = 0;
      renderAdminSupportConversations();
      renderAdminSupportThread();
      if (!silent && adminSupportMessage) adminSupportMessage.textContent = "";
    } catch (error) {
      if (!silent && adminSupportMessage) adminSupportMessage.textContent = error.message;
    }
  })().finally(() => {
    adminSupportMessagesRequest = null;
  });
  return adminSupportMessagesRequest;
}

async function loadAdminSupportConversations({ selectFirst = false, silent = false } = {}) {
  if (adminSupportLoadRequest) return adminSupportLoadRequest;
  adminSupportLoadRequest = (async () => {
    try {
      const result = await adminRequest("/api/admin/support/conversations", { cache: "no-store" });
      adminSupportConversations = result.conversations || [];
      if (
        activeAdminSupportConversationId &&
        !adminSupportConversations.some((conversation) => Number(conversation.id) === Number(activeAdminSupportConversationId))
      ) {
        activeAdminSupportConversationId = null;
        adminSupportMessages = [];
        adminSupportLastMessageId = 0;
      }
      if (!activeAdminSupportConversationId && selectFirst && adminSupportConversations.length) {
        activeAdminSupportConversationId = Number(adminSupportConversations[0].id);
        adminSupportMessages = [];
        adminSupportLastMessageId = 0;
      }
      renderAdminSupportConversations();
      renderAdminSupportThread();
      if (activeAdminSupportConversationId) await loadAdminSupportMessages({ reset: adminSupportLastMessageId === 0, silent: true });
      if (!silent && adminSupportMessage) adminSupportMessage.textContent = "";
    } catch (error) {
      if (!silent && adminSupportMessage) adminSupportMessage.textContent = error.message;
    }
  })().finally(() => {
    adminSupportLoadRequest = null;
  });
  return adminSupportLoadRequest;
}

function startAdminSupportPolling() {
  stopAdminSupportPolling();
  adminSupportPollTimer = window.setInterval(() => {
    if (
      currentUser?.role === "admin" &&
      !adminView.classList.contains("hidden") &&
      adminEditorSelect?.value === "messages" &&
      document.visibilityState === "visible"
    ) {
      loadAdminSupportConversations({ silent: true });
    }
  }, 12_000);
}

function stopAdminSupportPolling() {
  if (!adminSupportPollTimer) return;
  window.clearInterval(adminSupportPollTimer);
  adminSupportPollTimer = null;
}

async function sendAdminSupportMessage() {
  const body = String(adminSupportInput?.value || "").trim();
  if (!body || !activeAdminSupportConversationId) return;
  adminSupportSendButton.disabled = true;
  if (adminSupportMessage) adminSupportMessage.textContent = "Отправляю...";
  try {
    const result = await adminRequest(`/api/admin/support/conversations/${activeAdminSupportConversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: body })
    });
    adminSupportMessages = mergeSupportMessages(adminSupportMessages, [result.message]);
    adminSupportLastMessageId = Math.max(adminSupportLastMessageId, Number(result.message?.id) || 0);
    adminSupportInput.value = "";
    renderAdminSupportThread();
    await loadAdminSupportConversations({ silent: true });
    if (adminSupportMessage) adminSupportMessage.textContent = "Ответ отправлен.";
  } catch (error) {
    if (adminSupportMessage) adminSupportMessage.textContent = error.message;
  } finally {
    adminSupportSendButton.disabled = false;
    adminSupportInput?.focus();
  }
}

async function checkSession() {
  const token = localStorage.getItem(tokenKey);
  if (!token) {
    currentUser = null;
    updateAuthUi();
    return;
  }
  if (!hasUsableStoredToken(token)) {
    clearStoredSession();
    currentUser = null;
    updateAuthUi();
    return;
  }
  try {
    const response = await fetch(apiUrl("/api/auth/me"), { headers: authHeaders(), cache: "no-cache" });
    if (!response.ok) throw new Error("session expired");
    const result = await response.json();
    currentUser = result.user;
    bindSupportIdentityToUser(result.user);
    storeSession(token, result.user);
  } catch {
    clearStoredSession();
    currentUser = null;
  }
  updateAuthUi();
}

async function handleAuthLinks() {
  const params = new URLSearchParams(window.location.search);
  const verifyEmailToken = params.get("verifyEmailToken");
  const resetToken = params.get("resetPasswordToken");

  if (verifyEmailToken) {
    openAuth("login");
    authMessage.textContent = "Подтверждаем почту...";
    try {
      await authRequest("/api/auth/verify-email", { token: verifyEmailToken });
      authMessage.textContent = "Почта подтверждена.";
    } catch (error) {
      authMessage.textContent = error.message;
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  if (resetToken) {
    resetPasswordToken = resetToken;
    openAuth("reset");
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

function parseJsonObject(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function normalizeModel(row) {
  return {
    id: row.id,
    slug: row.slug || "",
    categoryId: row.categoryId ?? row.category_id ?? null,
    categoryName: row.categoryName || "",
    categorySlug: row.categorySlug || "",
    name: row.name,
    manufacturer: row.manufacturer || "",
    supplierSku: row.supplierSku || "",
    caseMaterial: row.caseMaterial || "TPU",
    caseColor: row.caseColor || "transparent",
    retailPrice: Number(row.retailPrice ?? defaultCasePrice),
    oldPrice: row.oldPrice == null ? null : Number(row.oldPrice),
    productionDays: Number(row.productionDays ?? 3),
    w: row.caseWidth ?? row.w,
    h: row.caseHeight ?? row.h,
    r: row.cornerRadius ?? row.r,
    frameWidth: Number(row.frameWidth ?? row.frame_width ?? 18),
    camera: row.cameraType ?? row.camera,
    color: row.color,
    logo: row.logo,
    phoneImageUrl: row.phoneImageUrl || null,
    cameraImageUrl: row.cameraImageUrl || null,
    cameraMaskUrl: row.cameraMaskUrl || null,
    cameraWorkUrl: row.cameraWorkUrl || null,
    cameraEditorState: parseJsonObject(row.cameraEditorState),
    cameraOffsetX: Number(row.cameraOffsetX ?? 0),
    cameraOffsetY: Number(row.cameraOffsetY ?? 0),
    cameraScale: Number(row.cameraScale ?? 1),
    inStock: row.inStock ?? row.in_stock ?? true
  };
}

function moneyLabel(value, currency = "RUB") {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency }).format(amount);
}

function dayWord(value) {
  return Math.abs(Number(value || 0)) === 1 ? "дня" : "дней";
}

function updateHeroPrice() {
  if (!heroPrice) return;
  const prices = models
    .map((model) => Number(model.retailPrice ?? defaultCasePrice))
    .filter((price) => Number.isFinite(price) && price > 0);
  const minimum = prices.length ? Math.min(...prices) : defaultCasePrice;
  heroPrice.textContent = `от ${moneyLabel(minimum)}`;
}

function isModelUnavailable(model = selectedModel()) {
  return model?.inStock === false || model?.inStock === 0 || model?.inStock === "0";
}

function updateModelSummary(model) {
  if (!model) return;
  const price = Number(model.retailPrice ?? defaultCasePrice);
  const oldPrice = Number(model.oldPrice || 0);
  const productionDays = Math.max(1, Number(model.productionDays ?? 3));
  const unavailable = isModelUnavailable(model);
  const rawMaterial = String(model.caseMaterial || "TPU").trim();
  const materialLabels = {
    tpu: "Гибкий TPU",
    silicone: "Силикон",
    plastic: "Пластик",
    polycarbonate: "Поликарбонат"
  };

  if (modelPrice) modelPrice.textContent = moneyLabel(price);
  if (modelOldPrice) {
    const showOldPrice = oldPrice > price;
    modelOldPrice.classList.toggle("hidden", !showOldPrice);
    modelOldPrice.textContent = showOldPrice ? moneyLabel(oldPrice) : "";
  }
  if (modelProduction) {
    modelProduction.textContent = unavailable
      ? "Временно нет"
      : `от ${productionDays} ${dayWord(productionDays)}`;
  }
  if (modelMaterial) modelMaterial.textContent = materialLabels[rawMaterial.toLowerCase()] || rawMaterial;
}

function populateModels() {
  modelSelect.innerHTML = "";
  if (templateModel) templateModel.innerHTML = "";
  if (models.length === 0) {
    modelSelect.append(new Option("Модели не найдены", ""));
    currentModel = currentModel || fallbackModels[0];
    render();
    renderAdminModelPreview();
    return;
  }
  models.forEach((model, index) => {
    modelSelect.append(new Option(model.name, String(index)));
    if (templateModel) templateModel.append(new Option(model.name, String(model.id)));
  });
  currentModel = models[Number(modelSelect.value)] || models[0];
  updateHeroPrice();
  updateModelSummary(currentModel);
  updateModelPickerButton();
  render();
  renderAdminModelPreview();
}

function selectedModel() {
  const selectedIndex = Number(modelSelect?.value);
  return models[selectedIndex] || models[0] || currentModel || fallbackModels[0];
}

function restoreCachedModels() {
  const cachedModels = readJsonCache(modelsCacheKey);
  if (Array.isArray(cachedModels) && cachedModels.length > 0) {
    modelCatalog = cachedModels.map(normalizeModel);
    models = [...modelCatalog];
  }
  populateModels();
}

function applyModelCatalogFilters() {
  const search = String(modelSearchInput?.value || "").trim().toLowerCase();
  const source = modelCatalog.length ? modelCatalog : fallbackModels;
  models = source.filter((model) => {
    if (selectedModelCategoryId && String(model.categoryId || "") !== String(selectedModelCategoryId)) return false;
    return !search || String(model.name || "").toLowerCase().includes(search);
  });
  populateModels();
  preloadImages(models.flatMap((model) => [model.phoneImageUrl, model.cameraMaskUrl]));
}

async function fetchModelCatalog({ force = false, admin = false } = {}) {
  if (!force && modelCatalogLoaded) return modelCatalog;
  if (modelCatalogRequest) return modelCatalogRequest;

  modelCatalogRequest = (async () => {
    let rows;
    if (admin) {
      rows = await adminRequest("/api/admin/models", { cache: "no-store" });
    } else {
      const response = await fetch(apiUrl("/api/models"), { cache: force ? "no-cache" : "default" });
      if (!response.ok) throw new Error("models API unavailable");
      rows = await response.json();
    }
    modelCatalog = rows.map(normalizeModel);
    modelCatalogLoaded = true;
    writeJsonCache(modelsCacheKey, rows);
    return modelCatalog;
  })().finally(() => {
    modelCatalogRequest = null;
  });
  return modelCatalogRequest;
}

async function loadModels({ force = false } = {}) {
  try {
    await fetchModelCatalog({ force });
  } catch {
    if (!modelCatalog.length) modelCatalog = [...fallbackModels];
  }
  applyModelCatalogFilters();
}

function caseRect(model = currentModel) {
  const safeModel = model || fallbackModels[0];
  return {
    x: (canvas.width - safeModel.w) / 2,
    y: (canvas.height - safeModel.h) / 2 + 18,
    w: safeModel.w,
    h: safeModel.h,
    r: safeModel.r
  };
}

function roundRectPath(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#fff3df");
  gradient.addColorStop(0.48, "#edf6e9");
  gradient.addColorStop(1, "#d6edf7");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(240, 107, 52, 0.18)";
  ctx.beginPath();
  ctx.arc(165, 165, 118, 0, Math.PI * 2);
  ctx.fill();
}

function selectedLayer() {
  return userLayers.find((layer) => layer.id === selectedLayerId) || null;
}

function syncControlsFromSelectedLayer() {
  const layer = selectedLayer();
  const imageLayer = layer && !isTextLayer(layer) ? layer : null;
  const imagePeers = imageLayer ? userLayers.filter((item) => !isTextLayer(item)) : [];
  const imagePosition = imageLayer ? imagePeers.findIndex((item) => item.id === imageLayer.id) : -1;
  if (sendBackwardButton) sendBackwardButton.disabled = imagePosition <= 0;
  if (bringForwardButton) bringForwardButton.disabled = imagePosition < 0 || imagePosition >= imagePeers.length - 1;
  if (deleteSelectedImageButton) deleteSelectedImageButton.disabled = !imageLayer;
  if (!layer) return;
  scaleInput.value = String(Math.round(layer.scale * 100));
  rotateInput.value = String(Math.round(layer.rotation * 180 / Math.PI));
  scaleOutput.textContent = `${scaleInput.value}%`;
  rotateOutput.textContent = `${rotateInput.value}°`;
}

function syncInputsFromActiveLayer() {
  syncControlsFromSelectedLayer();
}

function syncActiveLayerFromInputs() {
  const activeLayer = selectedLayer();
  if (!activeLayer) return;
  activeLayer.scale = Number(scaleInput.value) / 100;
  activeLayer.rotation = Number(rotateInput.value) * Math.PI / 180;
}

const textFontFamilies = {
  manrope: "Manrope, sans-serif",
  unbounded: "Unbounded, sans-serif",
  marck: '"Marck Script", cursive',
  russo: '"Russo One", sans-serif'
};

function isTextLayer(layer) {
  return layer?.type === "text";
}

function imageLayerKind(layer) {
  if (!layer || isTextLayer(layer)) return null;
  if (["photo", "sticker", "template"].includes(layer.kind)) return layer.kind;
  if (String(layer.sourceUrl || "").startsWith("data:")) return "photo";
  return "photo";
}

function setSelectedDesignLayer(nextLayerId) {
  const previousLayer = selectedLayer();
  const normalizedNextId = nextLayerId || null;
  if ((previousLayer?.id || null) === normalizedNextId) return;
  const nextLayer = userLayers.find((layer) => layer.id === normalizedNextId) || null;
  selectedLayerId = normalizedNextId;
  if (previousLayer && (!nextLayer || isTextLayer(previousLayer) !== isTextLayer(nextLayer))) {
    window.dispatchEvent(new CustomEvent("case-editor:close-tool-editor", { detail: { reason: "layer-deselected" } }));
  }
}

function openEditorForLayer(layer = selectedLayer()) {
  if (isTextLayer(layer)) {
    window.dispatchEvent(new CustomEvent("case-editor:text-selected"));
  } else if (layer) {
    window.dispatchEvent(new CustomEvent("case-editor:image-selected", { detail: { kind: imageLayerKind(layer) } }));
  }
}

function textLayerMetrics(drawCtx, layer, renderScale = 1) {
  const fontSize = Math.max(12, Number(layer.fontSize) || 72) * renderScale;
  const lineHeight = fontSize * 1.25;
  const lines = String(layer.text || "Текст").split(/\r?\n/).slice(0, 8);
  drawCtx.save();
  drawCtx.font = `${layer.fontWeight === "700" ? "700" : "400"} ${fontSize}px ${textFontFamilies[layer.fontFamily] || textFontFamilies.manrope}`;
  const width = Math.max(...lines.map((line) => drawCtx.measureText(line || " ").width), fontSize) + (Number(layer.strokeWidth) || 0) * 2 * renderScale;
  drawCtx.restore();
  return { lines, width, height: Math.max(lineHeight, lines.length * lineHeight), fontSize, lineHeight };
}

function layerDisplaySize(drawCtx, layer, rect, renderScale = 1) {
  if (isTextLayer(layer)) {
    const metrics = textLayerMetrics(drawCtx, layer, renderScale);
    layer.width = metrics.width / renderScale;
    layer.height = metrics.height / renderScale;
    return { drawW: metrics.width * layer.scale, drawH: metrics.height * layer.scale, drawScale: layer.scale, metrics };
  }
  const coverScale = Math.max(rect.w / layer.image.width, rect.h / layer.image.height);
  const drawScale = coverScale * layer.scale;
  return { drawW: layer.image.width * drawScale, drawH: layer.image.height * drawScale, drawScale, metrics: null };
}

function drawUserLayerOnContext(drawCtx, layer, rect, { showSelection = false, renderScale = 1 } = {}) {
  const { drawW, drawH, drawScale, metrics } = layerDisplaySize(drawCtx, layer, rect, renderScale);
  const centerX = rect.x + rect.w / 2 + layer.x;
  const centerY = rect.y + rect.h / 2 + layer.y;
  drawCtx.save();
  drawCtx.translate(centerX, centerY);
  drawCtx.rotate(layer.rotation);
  drawCtx.globalAlpha = isTextLayer(layer) ? Math.min(1, Math.max(0.05, Number(layer.opacity) || 1)) : 1;
  if (isTextLayer(layer)) {
    const align = ["left", "center", "right"].includes(layer.textAlign) ? layer.textAlign : "center";
    const anchorX = align === "left" ? -drawW / 2 : align === "right" ? drawW / 2 : 0;
    drawCtx.font = `${layer.fontWeight === "700" ? "700" : "400"} ${metrics.fontSize * layer.scale}px ${textFontFamilies[layer.fontFamily] || textFontFamilies.manrope}`;
    drawCtx.textAlign = align;
    drawCtx.textBaseline = "middle";
    drawCtx.fillStyle = layer.color || "#17201b";
    if (layer.shadowEnabled) {
      drawCtx.shadowColor = layer.shadowColor || "rgba(0,0,0,0.45)";
      drawCtx.shadowBlur = (Number(layer.shadowBlur) || 8) * renderScale;
      drawCtx.shadowOffsetX = 3 * renderScale;
      drawCtx.shadowOffsetY = 4 * renderScale;
    }
    metrics.lines.forEach((line, index) => {
      const y = (index - (metrics.lines.length - 1) / 2) * metrics.lineHeight * layer.scale;
      if (layer.strokeEnabled && Number(layer.strokeWidth) > 0) {
        drawCtx.lineJoin = "round";
        drawCtx.lineWidth = Number(layer.strokeWidth) * 2 * renderScale * layer.scale;
        drawCtx.strokeStyle = layer.strokeColor || "#ffffff";
        drawCtx.strokeText(line || " ", anchorX, y);
      }
      drawCtx.fillText(line || " ", anchorX, y);
    });
    drawCtx.shadowColor = "transparent";
  } else {
    drawCtx.drawImage(layer.image, -drawW / 2, -drawH / 2, drawW, drawH);
  }
  if (showSelection && layer.id === selectedLayerId) {
    drawCtx.globalAlpha = 1;
    drawCtx.lineWidth = 4;
    drawCtx.strokeStyle = "rgba(240, 107, 52, 0.95)";
    drawCtx.strokeRect(-drawW / 2, -drawH / 2, drawW, drawH);
    const markerRadius = 13;
    drawCtx.fillStyle = "#f06b34";
    drawCtx.strokeStyle = "#fffaf0";
    drawCtx.lineWidth = 4;
    [[-drawW / 2, -drawH / 2], [drawW / 2, -drawH / 2], [-drawW / 2, drawH / 2], [drawW / 2, drawH / 2]].forEach(([x, y]) => {
      drawCtx.beginPath();
      drawCtx.arc(x, y, markerRadius, 0, Math.PI * 2);
      drawCtx.fill();
      drawCtx.stroke();
    });
  }
  drawCtx.restore();
}

function drawUserLayer(layer, rect, { showSelection = true } = {}) {
  drawUserLayerOnContext(ctx, layer, rect, { showSelection });
}

function drawUserLayers(rect, { showSelection = true } = {}) {
  orderedLayersForRendering().forEach((layer) => drawUserLayer(layer, rect, { showSelection }));
}

function orderedLayersForRendering(layers = userLayers) {
  return [
    ...layers.filter((layer) => !isTextLayer(layer)),
    ...layers.filter((layer) => isTextLayer(layer))
  ];
}

function imageLayerCount(layers = userLayers) {
  return layers.filter((layer) => !isTextLayer(layer)).length;
}

function textLayerCount(layers = userLayers) {
  return layers.filter((layer) => isTextLayer(layer)).length;
}

function canAddImageLayers(count = 1, { currentCount = imageLayerCount(), messageTarget = templateAdminMessage } = {}) {
  if (currentCount + count <= maxImageLayers) return true;
  if (messageTarget) messageTarget.textContent = `Можно добавить не больше ${maxImageLayers} фотографий.`;
  return false;
}

function canAddTextLayers(count = 1, { currentCount = textLayerCount(), messageTarget = templateAdminMessage } = {}) {
  if (currentCount + count <= maxTextLayers) return true;
  if (messageTarget) messageTarget.textContent = `Можно добавить не больше ${maxTextLayers} надписей.`;
  return false;
}

function addUserImageLayer(
  image,
  templateId = null,
  sourceUrl = "",
  { scale = 1, kind = templateId ? "template" : "photo", openEditor = true } = {}
) {
  if (!canAddImageLayers()) {
    return;
  }
  templateApplyRequestId += 1;
  const before = designTransformSnapshot();
  const layer = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: "image",
    kind,
    image,
    sourceUrl,
    x: 0,
    y: 0,
    scale,
    rotation: 0
  };
  userLayers.push(layer);
  setSelectedDesignLayer(layer.id);
  userImage = image;
  activeTemplateId = templateId;
  syncControlsFromSelectedLayer();
  commitDesignHistory(before);
  renderTemplates();
  render();
  if (openEditor) openEditorForLayer(layer);
  return layer;
}

function layerStatePayload(layer, rect = caseRect(), { relative = false } = {}) {
  const payload = {
    id: layer.id,
    type: isTextLayer(layer) ? "text" : "image",
    x: layer.x,
    y: layer.y,
    scale: layer.scale,
    rotation: layer.rotation
  };
  if (isTextLayer(layer)) {
    Object.assign(payload, {
      text: layer.text,
      width: layer.width,
      height: layer.height,
      color: layer.color,
      fontFamily: layer.fontFamily,
      fontSize: layer.fontSize,
      fontWeight: layer.fontWeight,
      textAlign: layer.textAlign,
      opacity: layer.opacity,
      strokeEnabled: layer.strokeEnabled,
      strokeColor: layer.strokeColor,
      strokeWidth: layer.strokeWidth,
      shadowEnabled: layer.shadowEnabled,
      shadowColor: layer.shadowColor,
      shadowBlur: layer.shadowBlur
    });
  } else {
    payload.sourceUrl = layer.sourceUrl;
    payload.kind = imageLayerKind(layer);
  }
  if (relative && rect?.w && rect?.h) {
    payload.xRatio = layer.x / rect.w;
    payload.yRatio = layer.y / rect.h;
    payload.caseWidth = rect.w;
    payload.caseHeight = rect.h;
  }
  return payload;
}

function designStatePayload({ includeModel = true, relativeLayers = false } = {}) {
  const rect = caseRect();
  return {
    ...(includeModel ? { modelId: currentModel?.id || null } : {}),
    layers: userLayers.map((layer) => layerStatePayload(layer, rect, { relative: relativeLayers }))
  };
}

function sourceImagesPayload() {
  return userLayers.filter((layer) => !isTextLayer(layer)).map((layer, index) => ({
    index: index + 1,
    sourceUrl: layer.sourceUrl
  })).filter((item) => item.sourceUrl);
}

function printDesignDataUrl() {
  syncActiveLayerFromInputs();
  const baseWidth = Math.max(1, Math.round(currentModel?.w || canvas.width));
  const baseHeight = Math.max(1, Math.round(currentModel?.h || canvas.height));
  const sourceMaxSide = userLayers.reduce((maxSide, layer) => {
    return Math.max(maxSide, layer.image?.width || 0, layer.image?.height || 0);
  }, Math.max(baseWidth, baseHeight));
  const targetLongSide = Math.max(2048, Math.max(baseWidth, baseHeight), Math.min(4096, sourceMaxSide));
  const exportScale = targetLongSide / Math.max(baseWidth, baseHeight);
  const width = Math.max(1, Math.round(baseWidth * exportScale));
  const height = Math.max(1, Math.round(baseHeight * exportScale));
  const printCanvas = document.createElement("canvas");
  printCanvas.width = width;
  printCanvas.height = height;
  const printCtx = printCanvas.getContext("2d");
  const printRect = {
    x: 0,
    y: 0,
    w: width,
    h: height
  };
  roundedPathForContext(printCtx, 0, 0, width, height, (currentModel?.r || 0) * exportScale);
  printCtx.clip();
  orderedLayersForRendering().forEach((layer) => {
    drawUserLayerOnContext(printCtx, {
      ...layer,
      x: layer.x * exportScale,
      y: layer.y * exportScale
    }, printRect, { renderScale: exportScale });
  });
  return printCanvas.toDataURL("image/png");
}

function syncLayerSourceUrlsFromTemplateData(templateData) {
  const data = parseJsonObject(templateData);
  const layers = Array.isArray(data.layers) ? data.layers : [];
  layers.forEach((layer, index) => {
    const sourceUrl = String(layer?.sourceUrl || "");
    if (sourceUrl && !sourceUrl.startsWith("data:image/") && userLayers[index]) {
      userLayers[index].sourceUrl = sourceUrl;
    }
  });
}

async function saveCurrentCaseToProfile({ title, silent = false, refreshProfile = true } = {}) {
  if (!currentUser) return null;
  if (userLayers.length === 0) {
    throw new Error("Добавьте хотя бы одно изображение или текст на чехол.");
  }

  const model = selectedModel();
  const payload = {
    title: title || `${model.name || "Модель"} - ${new Date().toLocaleString("ru-RU")}`,
    phoneModelId: model.id || null,
    previewWithCameraDataUrl: caseSnapshotDataUrl({ withCamera: true }),
    designWithoutCameraDataUrl: printDesignDataUrl(),
    sourceImagesJson: JSON.stringify(sourceImagesPayload()),
    designStateJson: JSON.stringify(designStatePayload())
  };
  const result = await adminRequest("/api/profile/designs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const cacheKey = profileDesignsCacheKey();
  if (cacheKey) removeCache(cacheKey);
  savedDesigns = [];
  if (refreshProfile && profileDialog?.open) await loadProfileDesigns();
  return result;
}

async function saveDesignToProfile() {
  openSaveChoiceDialog();
}

function openSaveChoiceDialog(message = "") {
  if (!saveChoiceDialog) return;
  const unavailable = isModelUnavailable();
  saveChoiceStatus.textContent = message || (unavailable
    ? "Эта модель временно недоступна для заказа, но вы можете скачать готовый PNG."
    : "");
  saveFileChoiceButton.disabled = false;
  saveProfileChoiceButton.disabled = unavailable;
  if (typeof saveChoiceDialog.showModal === "function") saveChoiceDialog.showModal();
  else saveChoiceDialog.setAttribute("open", "");
}

function confirmAction(message) {
  return new Promise((resolve) => {
    actionConfirmMessage.textContent = message;
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      actionConfirmDialog.close();
      resolve(result);
    };
    closeActionConfirmButton.onclick = () => finish(false);
    cancelActionConfirmButton.onclick = () => finish(false);
    acceptActionConfirmButton.onclick = () => finish(true);
    actionConfirmDialog.oncancel = (event) => {
      event.preventDefault();
      finish(false);
    };
    if (typeof actionConfirmDialog.showModal === "function") actionConfirmDialog.showModal();
    else actionConfirmDialog.setAttribute("open", "");
  });
}

async function saveDesignAsFile() {
  if (userLayers.length === 0) {
    saveChoiceStatus.textContent = "Добавьте хотя бы одно изображение или текст на чехол.";
    return;
  }
  const previousText = saveFileChoiceButton.textContent;
  saveFileChoiceButton.disabled = true;
  saveProfileChoiceButton.disabled = true;
  saveFileChoiceButton.textContent = "Создаю файл...";
  saveChoiceStatus.textContent = "Подготавливаем PNG в производственном качестве...";
  try {
    await downloadDesignSheetPng();
    saveChoiceStatus.textContent = "Файл создан и передан в загрузки устройства.";
  } catch (error) {
    saveChoiceStatus.textContent = error.message || "Не удалось создать файл.";
  } finally {
    saveFileChoiceButton.disabled = false;
    saveProfileChoiceButton.disabled = isModelUnavailable();
    saveFileChoiceButton.textContent = previousText;
  }
}

async function saveDesignFromChoiceToProfile() {
  if (isModelUnavailable()) {
    saveChoiceStatus.textContent = "Эта модель временно недоступна для заказа. Скачайте PNG или выберите другую модель.";
    return;
  }
  if (!currentUser) {
    pendingProfileSaveAfterAuth = true;
    saveChoiceStatus.textContent = "Войдите или зарегистрируйтесь. Текущий дизайн останется в редакторе.";
    saveChoiceDialog.close();
    openAuth("login");
    authMessage.textContent = "После входа вы вернётесь к сохранению текущего дизайна.";
    return;
  }
  const previousText = saveProfileChoiceButton.textContent;
  saveFileChoiceButton.disabled = true;
  saveProfileChoiceButton.disabled = true;
  saveProfileChoiceButton.textContent = "Сохраняю...";
  saveChoiceStatus.textContent = "Сохраняем дизайн перед оформлением...";
  let savedDesign = null;
  try {
    savedDesign = await saveCurrentCaseToProfile({ refreshProfile: false });
    saveChoiceStatus.textContent = "Дизайн сохранён. Открываем оформление заказа...";
  } catch (error) {
    saveChoiceStatus.textContent = error.message || "Не удалось сохранить дизайн.";
  } finally {
    saveFileChoiceButton.disabled = false;
    saveProfileChoiceButton.disabled = isModelUnavailable();
    saveProfileChoiceButton.textContent = previousText;
  }
  if (!savedDesign) return;

  saveChoiceDialog.close();
  try {
    const orderStarted = await payProfileDesigns([savedDesign]);
    if (orderStarted === false) {
      await openProfile();
      profileMeta.textContent = "Дизайн сохранён. Вы сможете оформить его позже из профиля.";
    }
  } catch (error) {
    await openProfile();
    profileMeta.textContent = error.message || "Дизайн сохранён, но перейти к оформлению не удалось.";
  }
}

function drawImageInsideCase(rect, { showSelection = true } = {}) {
  roundRectPath(rect.x, rect.y, rect.w, rect.h, rect.r);
  ctx.save();
  ctx.clip();

  if (userLayers.length > 0) {
    drawUserLayers(rect, { showSelection });
  } else {
    const emptyGradient = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    emptyGradient.addColorStop(0, currentModel.color);
    emptyGradient.addColorStop(1, currentModel.logo === "samsung" ? "#1f1f1f" : "#fffdf6");
    ctx.fillStyle = emptyGradient;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = currentModel.logo === "samsung" ? "rgba(255,255,255,0.36)" : "rgba(23, 32, 27, 0.55)";
    ctx.font = "700 24px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Выберите макет", rect.x + rect.w / 2, rect.y + rect.h / 2 - 8);
    ctx.font = "500 16px Manrope, sans-serif";
    ctx.fillText("или загрузите свою картинку", rect.x + rect.w / 2, rect.y + rect.h / 2 + 24);
  }

  ctx.restore();
}

function drawUploadedModelBase(rect, { showCamera = true, showSelection = true } = {}) {
  const phoneImage = loadCachedImage(currentModel.phoneImageUrl);
  const cameraOverlay = loadCachedImage(currentModel.cameraMaskUrl);

  roundRectPath(rect.x, rect.y, rect.w, rect.h, rect.r);
  ctx.save();
  ctx.clip();

  if (phoneImage) {
    ctx.drawImage(phoneImage, rect.x, rect.y, rect.w, rect.h);
  } else {
    ctx.fillStyle = currentModel.color || "#d9e5f5";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  if (userLayers.length > 0) drawUserLayers(rect, { showSelection });

  ctx.restore();

  if (userLayers.length === 0) {
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "800 23px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Загрузите картинку", rect.x + rect.w / 2, rect.y + rect.h / 2 - 6);
    ctx.font = "700 15px Manrope, sans-serif";
    ctx.fillText("или выберите готовый макет", rect.x + rect.w / 2, rect.y + rect.h / 2 + 26);
  }

  if (cameraOverlay && showCamera) drawUploadedCameraMask(ctx, cameraOverlay, rect, currentModel);
}

// All uploaded camera masks use the same model-space transform in previews and exports.
function drawUploadedCameraMask(drawCtx, cameraMask, rect, layout = {}) {
  if (!cameraMask) return;
  const offsetX = Number(layout.cameraOffsetX ?? 0);
  const offsetY = Number(layout.cameraOffsetY ?? 0);
  const scale = Number(layout.cameraScale ?? 1) || 1;
  drawCtx.save();
  pathRound(drawCtx, rect.x, rect.y, rect.w, rect.h, rect.r || 0);
  drawCtx.clip();
  drawCtx.translate(rect.x + offsetX, rect.y + offsetY);
  drawCtx.scale(scale, scale);
  drawCtx.drawImage(cameraMask, 0, 0, rect.w, rect.h);
  drawCtx.restore();
}

function drawCaseShell(rect, model = currentModel) {
  const frameWidth = clamp(Number(model?.frameWidth ?? 18), 0, 18);
  ctx.save();
  if (frameWidth > 0) {
    roundRectPath(rect.x, rect.y, rect.w, rect.h, rect.r);
    ctx.lineWidth = frameWidth;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.88)";
    ctx.stroke();
  }
  roundRectPath(rect.x, rect.y, rect.w, rect.h, rect.r);
  ctx.lineWidth = Math.min(4, Math.max(1, frameWidth || 1));
  ctx.strokeStyle = "rgba(23, 32, 27, 0.26)";
  ctx.stroke();
  ctx.restore();
}

function drawLens(x, y, size) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath();
  ctx.arc(x, y, size + 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111816";
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#384b53";
  ctx.beginPath();
  ctx.arc(x - size * 0.2, y - size * 0.2, size * 0.48, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.beginPath();
  ctx.arc(x - size * 0.38, y - size * 0.42, size * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function roundedIsland(x, y, w, h, r) {
  ctx.save();
  roundRectPath(x, y, w, h, r);
  ctx.fillStyle = "rgba(245, 247, 241, 0.94)";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(23, 32, 27, 0.14)";
  ctx.stroke();
  ctx.restore();
}

function drawFlash(x, y) {
  ctx.save();
  ctx.fillStyle = "#f8e8a8";
  ctx.strokeStyle = "rgba(23, 32, 27, 0.18)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawCamera(rect) {
  ctx.save();
  const cameraOffsetX = Number(currentModel.cameraOffsetX ?? 0);
  const cameraOffsetY = Number(currentModel.cameraOffsetY ?? 0);
  const cameraScale = Number(currentModel.cameraScale ?? 1) || 1;
  const localRect = { x: 0, y: 0, w: rect.w, h: rect.h, r: rect.r };
  const camera = currentModel.camera;
  ctx.translate(rect.x + cameraOffsetX, rect.y + cameraOffsetY);
  ctx.scale(cameraScale, cameraScale);
  const x = 44;
  const y = 44;

  if (camera === "iphone-pro") {
    roundedIsland(x - 14, y - 14, 128, 128, 34);
    drawLens(x + 25, y + 24, 21);
    drawLens(x + 78, y + 24, 21);
    drawLens(x + 52, y + 77, 21);
    drawFlash(x + 92, y + 72);
  }
  if (camera === "iphone-dual") {
    roundedIsland(x - 10, y - 10, 98, 116, 30);
    drawLens(x + 39, y + 24, 22);
    drawLens(x + 39, y + 76, 22);
    drawFlash(x + 72, y + 50);
  }
  if (camera === "iphone-dual-diagonal") {
    roundedIsland(x - 10, y - 10, 112, 112, 30);
    drawLens(x + 26, y + 27, 22);
    drawLens(x + 74, y + 75, 22);
    drawFlash(x + 74, y + 30);
  }
  if (camera === "samsung-ultra") {
    drawLens(x + 18, y + 18, 21);
    drawLens(x + 18, y + 76, 21);
    drawLens(x + 76, y + 18, 18);
    drawLens(x + 76, y + 76, 18);
    drawFlash(x + 47, y + 47);
  }
  if (camera === "samsung-line") {
    drawLens(x + 26, y + 20, 20);
    drawLens(x + 26, y + 72, 20);
    drawLens(x + 26, y + 124, 20);
    drawFlash(x + 72, y + 72);
  }
  if (camera === "samsung-s24-fe") {
    drawLens(x + 18, y + 18, 22);
    drawLens(x + 18, y + 78, 22);
    drawLens(x + 18, y + 138, 22);
    drawFlash(x + 78, y + 50);
  }
  if (camera === "xiaomi-square") {
    roundedIsland(x - 12, y - 12, 122, 122, 26);
    drawLens(x + 25, y + 25, 21);
    drawLens(x + 76, y + 25, 21);
    drawLens(x + 25, y + 76, 21);
    drawFlash(x + 77, y + 77);
  }
  if (camera === "redmi-panel") {
    roundedIsland(x - 12, y - 12, 132, 150, 28);
    drawLens(x + 28, y + 30, 23);
    drawLens(x + 84, y + 30, 19);
    drawLens(x + 28, y + 88, 19);
    drawFlash(x + 84, y + 88);
  }
  if (camera === "pixel-bar") {
    roundedIsland(localRect.x + 28, localRect.y + 54, localRect.w - 56, 74, 28);
    drawLens(localRect.x + 92, localRect.y + 91, 21);
    drawLens(localRect.x + 148, localRect.y + 91, 18);
    drawFlash(localRect.x + localRect.w - 86, localRect.y + 91);
  }
  if (camera === "oneplus-circle") {
    ctx.fillStyle = "rgba(245, 247, 241, 0.9)";
    ctx.strokeStyle = "rgba(23, 32, 27, 0.16)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + 64, y + 64, 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawLens(x + 40, y + 45, 19);
    drawLens(x + 86, y + 45, 19);
    drawLens(x + 64, y + 88, 19);
    drawFlash(x + 88, y + 88);
  }
  ctx.restore();
}

function drawSamsungLogo(rect) {
  ctx.save();
  ctx.fillStyle = "rgba(18, 18, 17, 0.42)";
  ctx.font = "800 22px Manrope, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SAMSUNG", rect.x + rect.w / 2, rect.y + rect.h - 132);
  ctx.restore();
}

function render({ showCamera = true, showSelection = true } = {}) {
  currentModel = selectedModel();
  if (!currentModel) return;
  modelName.textContent = currentModel.name;
  updateModelSummary(currentModel);
  if (stockNotice) {
    const unavailable = isModelUnavailable(currentModel);
    stockNotice.classList.toggle("hidden", !unavailable);
    stockNotice.textContent = unavailable
      ? "Эта модель временно недоступна для заказа. Дизайн можно собрать и скачать, но оформить покупку пока не получится."
      : "";
  }
  syncActiveLayerFromInputs();
  scaleOutput.textContent = `${scaleInput.value}%`;
  rotateOutput.textContent = `${rotateInput.value}°`;

  const rect = caseRect();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  if (hasUploadedModel()) {
    drawUploadedModelBase(rect, { showCamera, showSelection });
  } else {
    drawImageInsideCase(rect, { showSelection });
  }
  drawCaseShell(rect, currentModel);
  if (!hasUploadedModel() && showCamera) {
    if (currentModel.logo === "samsung" && userLayers.length === 0) drawSamsungLogo(rect);
    drawCamera(rect);
  }
}

function caseSnapshotDataUrl({ withCamera = true } = {}) {
  render({ showCamera: withCamera, showSelection: false });
  const dataUrl = canvas.toDataURL("image/png");
  render();
  return dataUrl;
}

function safeFilePart(value) {
  return String(value || "design").toLowerCase().replace(/[^a-z0-9а-я]+/gi, "-").replace(/^-|-$/g, "") || "design";
}

function dataUrlToBytes(dataUrl) {
  const [header, body] = String(dataUrl || "").split(",");
  if (!header || !body) return new Uint8Array();
  const isBase64 = header.includes(";base64");
  const binary = isBase64 ? atob(body) : decodeURIComponent(body);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function dataUrlToFile(dataUrl, filename) {
  const typeMatch = String(dataUrl || "").match(/^data:([^;]+);/);
  return new File([dataUrlToBytes(dataUrl)], filename, { type: typeMatch?.[1] || "image/png" });
}

function fileExtensionFromDataUrl(dataUrl, fallback = "png") {
  const match = String(dataUrl || "").match(/^data:([^;,]+)/);
  const mime = match?.[1] || "";
  if (mime.includes("jpeg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("svg")) return "svg";
  if (mime.includes("gif")) return "gif";
  return fallback;
}

async function sourceToBytes(sourceUrl) {
  if (!sourceUrl) return null;
  if (sourceUrl.startsWith("data:")) {
    return {
      bytes: dataUrlToBytes(sourceUrl),
      extension: fileExtensionFromDataUrl(sourceUrl, "png")
    };
  }
  const response = await fetch(displayImageUrl(sourceUrl));
  if (!response.ok) return null;
  const blob = await response.blob();
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const extension = blob.type.includes("jpeg") ? "jpg" : blob.type.includes("webp") ? "webp" : blob.type.includes("svg") ? "svg" : "png";
  return { bytes, extension };
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  bytes.forEach((byte) => {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(target, offset, value) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32(target, offset, value) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = (value >>> 16) & 0xff;
  target[offset + 3] = (value >>> 24) & 0xff;
}

function concatBytes(parts) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  parts.forEach((part) => {
    result.set(part, offset);
    offset += part.length;
  });
  return result;
}

function createZipBlob(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const data = file.bytes;
    const checksum = crc32(data);

    const local = new Uint8Array(30 + nameBytes.length);
    writeUint32(local, 0, 0x04034b50);
    writeUint16(local, 4, 20);
    writeUint16(local, 6, 0);
    writeUint16(local, 8, 0);
    writeUint32(local, 14, checksum);
    writeUint32(local, 18, data.length);
    writeUint32(local, 22, data.length);
    writeUint16(local, 26, nameBytes.length);
    local.set(nameBytes, 30);
    localParts.push(local, data);

    const central = new Uint8Array(46 + nameBytes.length);
    writeUint32(central, 0, 0x02014b50);
    writeUint16(central, 4, 20);
    writeUint16(central, 6, 20);
    writeUint16(central, 8, 0);
    writeUint16(central, 10, 0);
    writeUint32(central, 16, checksum);
    writeUint32(central, 20, data.length);
    writeUint32(central, 24, data.length);
    writeUint16(central, 28, nameBytes.length);
    writeUint32(central, 42, offset);
    central.set(nameBytes, 46);
    centralParts.push(central);

    offset += local.length + data.length;
  });

  const centralOffset = offset;
  const centralDirectory = concatBytes(centralParts);
  const end = new Uint8Array(22);
  writeUint32(end, 0, 0x06054b50);
  writeUint16(end, 8, files.length);
  writeUint16(end, 10, files.length);
  writeUint32(end, 12, centralDirectory.length);
  writeUint32(end, 16, centralOffset);

  return new Blob([concatBytes(localParts), centralDirectory, end], { type: "application/zip" });
}

async function downloadDesignArchive() {
  const model = selectedModel();
  const safeName = safeFilePart(model.name || "phone-case");
  const files = [
    { name: "01-s-kamerami.png", bytes: dataUrlToBytes(caseSnapshotDataUrl({ withCamera: true })) },
    { name: "02-bez-kamer.png", bytes: dataUrlToBytes(printDesignDataUrl()) }
  ];

  const sources = sourceImagesPayload();
  for (let index = 0; index < sources.length; index += 1) {
    const source = await sourceToBytes(sources[index].sourceUrl);
    if (!source || source.bytes.length === 0) continue;
    files.push({
      name: `03-ishodniki/ishodnik-${String(index + 1).padStart(2, "0")}.${source.extension}`,
      bytes: source.bytes
    });
  }

  const readme = new TextEncoder().encode("В архиве: 01 - макет с камерами, 02 - макет без камер, 03-ishodniki - исходные картинки клиента.");
  files.push({ name: "opisanie.txt", bytes: readme });

  const blob = createZipBlob(files);
  const link = document.createElement("a");
  link.download = `chehol-${safeName}.zip`;
  link.href = URL.createObjectURL(blob);
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function imageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
}

function drawRoundedImage(drawCtx, image, x, y, width, height, radius = 0) {
  drawCtx.save();
  roundedPathForContext(drawCtx, x, y, width, height, radius);
  drawCtx.clip();
  drawCtx.drawImage(image, x, y, width, height);
  drawCtx.restore();
}

function drawCenteredCaption(drawCtx, text, x, y, width) {
  drawCtx.fillStyle = "#2f312f";
  drawCtx.font = "800 28px Manrope, Arial, sans-serif";
  drawCtx.textAlign = "center";
  drawCtx.fillText(text, x + width / 2, y);
}

async function downloadDesignSheetPng() {
  const model = selectedModel();
  const fullDesign = await imageFromDataUrl(caseSnapshotDataUrl({ withCamera: true }));
  const croppedDesign = await imageFromDataUrl(printDesignDataUrl());
  const sourceImages = userLayers.map((layer) => layer.image).filter(Boolean);

  const pageWidth = 1080;
  const margin = 64;
  const contentWidth = pageWidth - margin * 2;
  const gap = 52;
  const captionGap = 28;
  const footerHeight = 82;
  const fullHeight = Math.round(contentWidth * (fullDesign.height / fullDesign.width));
  const croppedWidthRatio = Math.min(1, Math.max(0.2, (model.w || croppedDesign.width) / Math.max(1, fullDesign.width)));
  const croppedWidth = Math.round(contentWidth * croppedWidthRatio);
  const croppedHeight = Math.round(croppedWidth * (croppedDesign.height / croppedDesign.width));
  const sourceBlocks = sourceImages.length > 0
    ? sourceImages.map((image) => {
      const scale = Math.min(contentWidth / image.width, 760 / image.height);
      return {
        image,
        width: Math.round(image.width * scale),
        height: Math.round(image.height * scale)
      };
    })
    : [];

  const sourceHeight = sourceBlocks.reduce((sum, block) => sum + captionGap + block.height + 32, 0);
  const pageHeight = 130 + fullHeight + gap + captionGap + croppedHeight + gap + sourceHeight + footerHeight;
  const sheet = document.createElement("canvas");
  sheet.width = pageWidth;
  sheet.height = pageHeight;
  const sheetCtx = sheet.getContext("2d");

  sheetCtx.fillStyle = "#fffdf8";
  sheetCtx.fillRect(0, 0, pageWidth, pageHeight);
  sheetCtx.textAlign = "center";
  sheetCtx.fillStyle = "#202320";
  sheetCtx.font = "900 34px Manrope, Arial, sans-serif";
  sheetCtx.fillText("📱 Варианты чехла", pageWidth / 2, 54);
  sheetCtx.font = "800 24px Manrope, Arial, sans-serif";
  sheetCtx.fillText(`📱 ${model.name || "Модель"}`, pageWidth / 2, 90);

  let y = 126;
  drawRoundedImage(sheetCtx, fullDesign, margin, y, contentWidth, fullHeight, 0);
  y += fullHeight + gap;

  drawCenteredCaption(sheetCtx, "✂️ Обрезанное фото", margin, y, contentWidth);
  y += captionGap;
  drawRoundedImage(sheetCtx, croppedDesign, margin + (contentWidth - croppedWidth) / 2, y, croppedWidth, croppedHeight, 0);
  y += croppedHeight + gap;

  sourceBlocks.forEach((block, index) => {
    drawCenteredCaption(sheetCtx, sourceBlocks.length > 1 ? `🖼️ Исходное фото ${index + 1}` : "🖼️ Исходное фото", margin, y, contentWidth);
    y += captionGap;
    drawRoundedImage(sheetCtx, block.image, margin + (contentWidth - block.width) / 2, y, block.width, block.height, 0);
    y += block.height + 32;
  });

  sheetCtx.fillStyle = "#9a9488";
  sheetCtx.font = "700 17px Manrope, Arial, sans-serif";
  sheetCtx.fillText("Создано в конструкторе чехлов ZestCaseSoul", pageWidth / 2, pageHeight - 34);

  const link = document.createElement("a");
  link.download = `zestcasesoul-${safeFilePart(model.name || "phone-case")}-design.png`;
  link.href = sheet.toDataURL("image/png");
  link.click();
}

function resetImage() {
  templateApplyRequestId += 1;
  setSelectedDesignLayer(null);
  userLayers = [];
  userImage = null;
  imageState = { x: 0, y: 0, scale: 1, rotation: 0 };
  scaleInput.value = "100";
  rotateInput.value = "0";
  syncControlsFromSelectedLayer();
  render();
}

function selectModelById(phoneModelId) {
  const index = models.findIndex((model) => model.id === Number(phoneModelId));
  if (index >= 0) modelSelect.value = String(index);
}

function loadImageFromSource(src, onLoad, onError) {
  const resolvedSrc = displayImageUrl(src);
  const image = new Image();
  if (/^https?:\/\//i.test(resolvedSrc)) image.crossOrigin = "anonymous";
  image.onload = () => onLoad(image);
  image.onerror = onError;
  image.src = resolvedSrc;
}

function loadCachedImage(src, onReady = render) {
  if (!src) return null;
  const absoluteSrc = displayImageUrl(src);
  const cached = modelImageCache.get(absoluteSrc);
  if (cached?.loaded) return cached.image;
  if (cached) return null;

  const image = new Image();
  if (/^https?:\/\//i.test(absoluteSrc)) image.crossOrigin = "anonymous";
  image.onload = () => {
    modelImageCache.set(absoluteSrc, { image, loaded: true });
    onReady();
  };
  image.onerror = () => modelImageCache.delete(absoluteSrc);
  image.src = absoluteSrc;
  modelImageCache.set(absoluteSrc, { image, loaded: false });
  return null;
}

function hasUploadedModel(model = currentModel) {
  return Boolean(model?.phoneImageUrl && model?.cameraMaskUrl);
}

async function applyImage(src, templateId = null) {
  try {
    const image = await loadImagePromise(src);
    addUserImageLayer(image, templateId, src);
  } catch {
    templateAdminMessage.textContent = "Не удалось загрузить изображение макета.";
  }
}

function templateLayerOffset(layer, rect = caseRect()) {
  if (Number.isFinite(Number(layer.xRatio)) || Number.isFinite(Number(layer.yRatio))) {
    return {
      x: Number(layer.xRatio || 0) * rect.w,
      y: Number(layer.yRatio || 0) * rect.h
    };
  }
  if (Number(layer.caseWidth) > 0 || Number(layer.caseHeight) > 0) {
    return {
      x: Number(layer.x || 0) * (rect.w / Number(layer.caseWidth || rect.w)),
      y: Number(layer.y || 0) * (rect.h / Number(layer.caseHeight || rect.h))
    };
  }
  return {
    x: Number(layer.x) || 0,
    y: Number(layer.y) || 0
  };
}

async function applyTemplate(template, { replace = false, replaceImages = false } = {}) {
  const requestId = ++templateApplyRequestId;
  const data = parseJsonObject(template?.templateData);
  const layers = Array.isArray(data.layers) ? data.layers : [];
  const templateLayers = layers.length
    ? layers
    : template?.imageUrl
      ? [{ type: "image", sourceUrl: template.imageUrl, x: 0, y: 0, scale: 1, rotation: 0 }]
      : [];
  if (!templateLayers.length) throw new Error("У макета нет изображения или слоёв.");

  const shouldReplaceImages = replace || replaceImages;
  const templateImageCount = templateLayers.filter((layer) => layer?.type !== "text" && layer?.sourceUrl).length;
  const templateTextCount = templateLayers.filter((layer) => layer?.type === "text").length;
  const currentImageCount = shouldReplaceImages ? 0 : imageLayerCount();
  const currentTextCount = replace ? 0 : textLayerCount();
  if (!canAddImageLayers(templateImageCount, { currentCount: currentImageCount })) return false;
  if (!canAddTextLayers(templateTextCount, { currentCount: currentTextCount })) return false;

  const rect = caseRect();
  let preparedLayers;
  try {
    preparedLayers = (await Promise.all(templateLayers.map(async (layer, index) => {
      const offset = templateLayerOffset(layer, rect);
      if (layer.type === "text") {
        const textLayer = textLayerFromState(layer, index, offset);
        if (!replace) textLayer.id = `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`;
        return textLayer;
      }
      if (!layer.sourceUrl) return null;
      const image = await loadImagePromise(layer.sourceUrl);
      return {
        id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
        type: "image",
        kind: "template",
        image,
        sourceUrl: layer.sourceUrl,
        x: offset.x,
        y: offset.y,
        scale: Number(layer.scale) || 1,
        rotation: Number(layer.rotation) || 0
      };
    }))).filter(Boolean);
  } catch (error) {
    if (requestId !== templateApplyRequestId) return false;
    throw error;
  }

  if (requestId !== templateApplyRequestId) return false;
  if (!canAddTextLayers(templateTextCount, { currentCount: replace ? 0 : textLayerCount() })) return false;

  const before = designTransformSnapshot();
  const preservedTextLayers = replaceImages && !replace ? userLayers.filter(isTextLayer) : [];
  const preservedSelectedTextId = preservedTextLayers.some((layer) => layer.id === selectedLayerId)
    ? selectedLayerId
    : null;
  if (replace || (replaceImages && !preservedSelectedTextId)) setSelectedDesignLayer(null);
  userLayers = replace
    ? preparedLayers
    : replaceImages
      ? [...preservedTextLayers, ...preparedLayers]
      : [...userLayers, ...preparedLayers];
  activeTemplateId = template.id;
  const newImageLayers = preparedLayers.filter((layer) => !isTextLayer(layer));
  userImage = newImageLayers.at(-1)?.image || [...userLayers].reverse().find((layer) => !isTextLayer(layer))?.image || null;
  setSelectedDesignLayer(preservedSelectedTextId || preparedLayers.at(-1)?.id || null);
  syncInputsFromActiveLayer();
  commitDesignHistory(before);
  renderTemplates();
  render();
  return true;
}

function normalizedTemplateTitle(template) {
  return String(template?.title || "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("ru-RU");
}

function stopDeathNoteWatchEffect() {
  deathNoteWatchPlayId += 1;
  if (deathNoteWatchTimer) window.clearTimeout(deathNoteWatchTimer);
  deathNoteWatchTimer = null;
  if (!deathNoteWatchEffect) return;
  deathNoteWatchEffect.classList.remove("is-active");
  deathNoteWatchEffect.hidden = true;
}

function playDeathNoteWatchEffect() {
  if (!deathNoteWatchEffect || !deathNoteWatchImage) return;

  const playId = ++deathNoteWatchPlayId;
  if (deathNoteWatchTimer) window.clearTimeout(deathNoteWatchTimer);
  deathNoteWatchTimer = null;
  deathNoteWatchEffect.classList.remove("is-active");
  deathNoteWatchEffect.hidden = true;

  const beginAnimation = () => {
    if (playId !== deathNoteWatchPlayId) return;
    const canvasRect = canvas.getBoundingClientRect();
    const watchWidth = window.innerWidth <= 860 ? 88 : 110;
    const horizontalCenter = clamp(
      canvasRect.left + canvasRect.width * 0.52,
      watchWidth / 2 + 12,
      window.innerWidth - watchWidth / 2 - 12
    );
    const targetTop = canvasRect.top + Math.min(canvasRect.height * 0.14, 110);
    const chainLength = clamp(targetTop, 68, Math.min(290, window.innerHeight * 0.45));

    deathNoteWatchEffect.style.setProperty("--death-note-watch-x", `${Math.round(horizontalCenter)}px`);
    deathNoteWatchEffect.style.setProperty("--death-note-chain-length", `${Math.round(chainLength)}px`);
    deathNoteWatchEffect.hidden = false;
    void deathNoteWatchEffect.offsetWidth;
    deathNoteWatchEffect.classList.add("is-active");

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    deathNoteWatchTimer = window.setTimeout(() => {
      if (playId !== deathNoteWatchPlayId) return;
      deathNoteWatchEffect.classList.remove("is-active");
      deathNoteWatchEffect.hidden = true;
      deathNoteWatchTimer = null;
    }, reducedMotion ? 1800 : 4400);
  };

  if (!deathNoteWatchImage.getAttribute("src")) {
    deathNoteWatchImage.src = displayImageUrl(deathNoteWatchImage.dataset.src);
  }
  if (deathNoteWatchImage.complete && deathNoteWatchImage.naturalWidth > 0) {
    beginAnimation();
    return;
  }
  deathNoteWatchImage.addEventListener("load", beginAnimation, { once: true });
}

function handleTemplateSelectionEffect(template) {
  if (normalizedTemplateTitle(template) === "тетрадь смерти") {
    playDeathNoteWatchEffect();
  } else {
    stopDeathNoteWatchEffect();
  }
}

function renderTemplates() {
  templateList.innerHTML = "";
  if (templates.length === 0) {
    const empty = document.createElement("p");
    empty.className = "admin-empty";
    empty.textContent = selectedTemplateCategoryId ? "В этой категории пока нет макетов." : "Выберите категорию макетов.";
    templateList.append(empty);
    return;
  }
  templates.forEach((template) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `template-card${template.id === activeTemplateId ? " is-active" : ""}`;
    button.innerHTML = `
      <img src="${displayImageUrl(template.previewUrl || template.imageUrl)}" alt="" loading="lazy" decoding="async">
      <strong>${template.title}</strong>
    `;
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        const applied = await applyTemplate(template, { replaceImages: true });
        if (applied) handleTemplateSelectionEffect(template);
      } catch {
        templateAdminMessage.textContent = "Не удалось открыть макет в редакторе.";
      } finally {
        button.disabled = false;
      }
    });
    templateList.append(button);
  });
}

function renderStickers() {
  if (!stickerList) return;
  stickerList.innerHTML = "";
  if (stickers.length === 0) {
    const empty = document.createElement("p");
    empty.className = "admin-empty sticker-empty";
    empty.textContent = selectedStickerCategoryId ? "В этой категории пока нет стикеров." : "Стикеры скоро появятся.";
    stickerList.append(empty);
    return;
  }

  stickers.forEach((sticker) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sticker-card";
    button.setAttribute("aria-label", `Добавить стикер «${sticker.title}»`);

    const preview = document.createElement("span");
    preview.className = "sticker-card-preview transparency-grid";
    const image = decorateImage(document.createElement("img"));
    image.src = displayImageUrl(sticker.imageUrl);
    image.alt = "";
    preview.append(image);

    const title = document.createElement("strong");
    title.textContent = sticker.title;
    button.append(preview, title);
    button.addEventListener("click", async () => {
      if (!canAddImageLayers()) return;
      button.disabled = true;
      try {
        const stickerImage = await loadImagePromise(sticker.imageUrl);
        addUserImageLayer(stickerImage, null, sticker.imageUrl, { scale: 0.38, kind: "sticker" });
      } catch {
        templateAdminMessage.textContent = "Не удалось добавить стикер. Попробуйте ещё раз.";
      } finally {
        button.disabled = false;
      }
    });
    stickerList.append(button);
  });
}

function createAdminButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function resetTemplateEditor() {
  editingTemplateId = null;
  adminTemplateForm.reset();
  if (templateCategorySelect) templateCategorySelect.value = "";
  if (adminTemplateForm.elements.image) adminTemplateForm.elements.image.required = false;
  templateSubmitButton.textContent = "Добавить макет";
  cancelTemplateEditButton.classList.add("hidden");
  templateAdminMessage.textContent = "";
  if (adminTemplateTextMessage) adminTemplateTextMessage.textContent = "";
  activeTemplateId = null;
  resetImage();
}

async function startTemplateEdit(template) {
  editingTemplateId = template.id;
  showAdminEditor("templates");
  adminTemplateForm.elements.title.value = template.title;
  if (templateCategorySelect) templateCategorySelect.value = template.categoryId ? String(template.categoryId) : "";
  if (adminTemplateForm.elements.image) {
    adminTemplateForm.elements.image.value = "";
    adminTemplateForm.elements.image.required = false;
  }
  templateSubmitButton.textContent = "Сохранить макет";
  cancelTemplateEditButton.classList.remove("hidden");
  templateAdminMessage.textContent = "Открываю макет в редакторе...";
  adminTemplateForm.scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    const fullTemplate = template.templateData !== undefined ? template : await adminRequest(`/api/admin/templates/${template.id}`, { cache: "no-cache" });
    await applyTemplate(fullTemplate, { replace: true });
    templateAdminMessage.textContent = "Макет открыт в редакторе.";
  } catch (error) {
    templateAdminMessage.textContent = error.message || "Не удалось открыть макет в редакторе.";
  }
}

async function deleteTemplate(template) {
  if (!await confirmAction(`Удалить макет «${template.title}»?`)) return;
  templateAdminMessage.textContent = "Удаляю макет...";
  try {
    await adminRequest(`/api/admin/templates/${template.id}`, { method: "DELETE" });
    if (editingTemplateId === template.id) resetTemplateEditor();
    await refreshTemplatesAfterAdminMutation();
    templateAdminMessage.textContent = "Макет удален.";
  } catch (error) {
    templateAdminMessage.textContent = error.message;
  }
}

function renderAdminTemplates() {
  if (!adminTemplateList) return;
  const adminTemplates = templateCatalog.length ? templateCatalog : templates;
  adminTemplateList.innerHTML = "";
  adminTemplatesStatus.textContent = `${adminTemplates.length}`;

  if (adminTemplates.length === 0) {
    const empty = document.createElement("p");
    empty.className = "admin-empty";
    empty.textContent = "Макетов пока нет.";
    adminTemplateList.append(empty);
    return;
  }

  adminTemplates.forEach((template) => {
    const item = document.createElement("article");
    item.className = "admin-list-item";

    const image = document.createElement("img");
    image.src = template.imageUrl;
    image.alt = "";

    const content = document.createElement("div");
    content.className = "admin-list-content";

    const title = document.createElement("strong");
    title.textContent = template.title;

    const meta = document.createElement("span");
    meta.textContent = "Для всех моделей";

    const actions = document.createElement("div");
    actions.className = "admin-list-actions";
    actions.append(
      createAdminButton("Открыть", "ghost mini-button", () => {
        applyImage(template.imageUrl, template.id);
        setViewForRole("client", true);
      }),
      createAdminButton("Изменить", "ghost mini-button", () => startTemplateEdit(template)),
      createAdminButton("Удалить", "danger mini-button", () => deleteTemplate(template))
    );

    content.append(title, meta, actions);
    item.append(image, content);
    adminTemplateList.append(item);
  });
}

function resetStickerEditor({ keepMessage = false } = {}) {
  editingStickerId = null;
  adminStickerForm?.reset();
  if (stickerCategorySelect) stickerCategorySelect.value = "";
  if (adminStickerForm?.elements.image) adminStickerForm.elements.image.required = true;
  if (stickerSubmitButton) stickerSubmitButton.textContent = "Добавить стикер";
  cancelStickerEditButton?.classList.add("hidden");
  if (!keepMessage && stickerAdminMessage) stickerAdminMessage.textContent = "";
}

function startStickerEdit(sticker) {
  editingStickerId = sticker.id;
  showAdminEditor("stickers");
  adminStickerForm.elements.title.value = sticker.title;
  if (stickerCategorySelect) stickerCategorySelect.value = sticker.categoryId ? String(sticker.categoryId) : "";
  if (adminStickerForm.elements.image) {
    adminStickerForm.elements.image.value = "";
    adminStickerForm.elements.image.required = false;
  }
  stickerSubmitButton.textContent = "Сохранить стикер";
  cancelStickerEditButton.classList.remove("hidden");
  stickerAdminMessage.textContent = "Можно заменить файл или оставить текущий.";
  adminStickerForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteSticker(sticker) {
  if (!await confirmAction(`Удалить стикер «${sticker.title}»?`)) return;
  stickerAdminMessage.textContent = "Удаляю стикер...";
  try {
    await adminRequest(`/api/admin/stickers/${sticker.id}`, { method: "DELETE" });
    if (editingStickerId === sticker.id) resetStickerEditor();
    await refreshStickersAfterAdminMutation();
    stickerAdminMessage.textContent = "Стикер удалён.";
  } catch (error) {
    stickerAdminMessage.textContent = error.message;
  }
}

function renderAdminStickers() {
  if (!adminStickerList) return;
  adminStickerList.innerHTML = "";
  adminStickersStatus.textContent = String(adminStickers.length);
  if (adminStickers.length === 0) {
    const empty = document.createElement("p");
    empty.className = "admin-empty";
    empty.textContent = "Стикеров пока нет.";
    adminStickerList.append(empty);
    return;
  }

  adminStickers.forEach((sticker) => {
    const item = document.createElement("article");
    item.className = "admin-list-item sticker-admin-item";
    const preview = document.createElement("span");
    preview.className = "sticker-admin-preview transparency-grid";
    const image = decorateImage(document.createElement("img"));
    image.src = displayImageUrl(sticker.imageUrl);
    image.alt = "";
    preview.append(image);

    const content = document.createElement("div");
    content.className = "admin-list-content";
    const title = document.createElement("strong");
    title.textContent = sticker.title;
    const meta = document.createElement("span");
    meta.textContent = sticker.categoryName || "Без категории";
    const actions = document.createElement("div");
    actions.className = "admin-list-actions";
    actions.append(
      createAdminButton("Изменить", "ghost mini-button", () => startStickerEdit(sticker)),
      createAdminButton("Удалить", "danger mini-button", () => deleteSticker(sticker))
    );
    content.append(title, meta, actions);
    item.append(preview, content);
    adminStickerList.append(item);
  });
}

function cornerPresetForRadius(radius) {
  if (Number(radius) === 0) return "sharp";
  if (Number(radius) === 24) return "soft";
  if (Number(radius) === 46) return "rounded";
  return "custom";
}

function radiusForCornerPreset(preset) {
  if (preset === "sharp") return 0;
  if (preset === "soft") return 24;
  if (preset === "rounded") return 46;
  return Number(adminModelForm.elements.cornerRadius.value || 46);
}

function readAdminModelForm() {
  const formData = new FormData(adminModelForm);
  return {
    id: editingModelId,
    name: String(formData.get("name") || "Новая модель").trim() || "Новая модель",
    camera: formData.get("cameraType"),
    w: Number(formData.get("caseWidth") || 330),
    h: Number(formData.get("caseHeight") || 690),
    r: Number(formData.get("cornerRadius") || 0),
    frameWidth: Number(formData.get("frameWidth") || 0),
    color: formData.get("color") || "#d9e5f5",
    logo: formData.get("logo") || null,
    cameraOffsetX: Number(formData.get("cameraOffsetX") || 0),
    cameraOffsetY: Number(formData.get("cameraOffsetY") || 0),
    cameraScale: Number(formData.get("cameraScale") || 100) / 100,
    inStock: formData.get("inStock") === "1"
  };
}

function loadLocalImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImagePromise(src) {
  return new Promise((resolve, reject) => {
    loadImageFromSource(src, resolve, reject);
  });
}

async function prepareUserImageFile(file) {
  const originalSourceUrl = await fileToDataUrl(file);
  const image = await loadImagePromise(originalSourceUrl);
  const maxSide = Math.max(image.width, image.height);
  const minSide = Math.min(image.width, image.height);
  if (minSide < 2000) {
    templateAdminMessage.textContent = "Фото ниже 2K разрешения. Если загрузить фото качеством выше, итоговый чехол будет четче.";
  }
  if (maxSide <= 4096) return { image, sourceUrl: originalSourceUrl };

  const scale = 4096 / maxSide;
  const resizedCanvas = document.createElement("canvas");
  resizedCanvas.width = Math.max(1, Math.round(image.width * scale));
  resizedCanvas.height = Math.max(1, Math.round(image.height * scale));
  resizedCanvas.getContext("2d").drawImage(image, 0, 0, resizedCanvas.width, resizedCanvas.height);
  const mimeType = file.type === "image/png" || file.type === "image/webp" ? file.type : "image/jpeg";
  const sourceUrl = resizedCanvas.toDataURL(mimeType, 0.92);
  return {
    image: await loadImagePromise(sourceUrl),
    sourceUrl
  };
}

function setModelSizeFromImage(image) {
  if (!image) return;
  const maxHeight = 690;
  const maxWidth = 360;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
  const width = Math.max(180, Math.round(image.width * scale));
  const height = Math.max(320, Math.round(image.height * scale));
  adminModelForm.elements.caseWidth.value = String(width);
  adminModelForm.elements.caseHeight.value = String(height);
  updateRangeOutputs();
}

function resizeMaskCanvasForImage(image) {
  const maxWidth = 640;
  const maxHeight = 820;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  cameraMaskCanvas.width = Math.max(1, Math.round(image.width * scale));
  cameraMaskCanvas.height = Math.max(1, Math.round(image.height * scale));
  if (cameraToolOverlayCanvas) {
    cameraToolOverlayCanvas.width = cameraMaskCanvas.width;
    cameraToolOverlayCanvas.height = cameraMaskCanvas.height;
  }
  updateMaskCanvasDisplay();
}

function resetFrameAndRingTools() {
  const width = cameraMaskCanvas.width || 420;
  const height = cameraMaskCanvas.height || 560;
  protectedFrame = {
    ...protectedFrame,
    enabled: Boolean(protectedFrameToggle?.checked),
    x: Math.round(width * 0.12),
    y: Math.round(height * 0.12),
    w: Math.round(width * 0.45),
    h: Math.round(height * 0.3),
    radius: Number(frameRadiusInput?.value || 24),
    thickness: Number(frameThicknessInput?.value || 10),
    color: frameColorInput?.value || "#111816"
  };
  protectionStrokes = [];
  protectionGuide = {
    x: Math.round(width * 0.28),
    y: Math.round(height * 0.25),
    radius: Math.round(Math.min(width, height) * 0.08)
  };
  protectionGuideVisible = true;
  rebuildProtectionMask();
}

function resetEraserHistory() {
  eraserHistory = [];
  eraserRedoHistory = [];
}

function cloneProtectionStrokes() {
  return protectionStrokes.map((stroke) => ({
    size: Number(stroke.size || 1),
    points: stroke.points.map((point) => [Number(point[0]), Number(point[1])])
  }));
}

function pushEraserHistory() {
  if (!cameraMaskCtx) return;
  eraserHistory.push({
    mask: cameraMaskCtx.getImageData(0, 0, cameraMaskCanvas.width, cameraMaskCanvas.height),
    protectionStrokes: cloneProtectionStrokes()
  });
  if (eraserHistory.length > 24) eraserHistory.shift();
  eraserRedoHistory = [];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundedPathForContext(drawCtx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  drawCtx.beginPath();
  drawCtx.moveTo(x + radius, y);
  drawCtx.arcTo(x + w, y, x + w, y + h, radius);
  drawCtx.arcTo(x + w, y + h, x, y + h, radius);
  drawCtx.arcTo(x, y + h, x, y, radius);
  drawCtx.arcTo(x, y, x + w, y, radius);
  drawCtx.closePath();
}

function drawProtectedFrame(drawCtx) {
  if (!protectedFrame.enabled) return;
  drawCtx.save();
  const radius = Math.min(protectedFrame.radius, protectedFrame.w / 2, protectedFrame.h / 2);
  roundedPathForContext(drawCtx, protectedFrame.x, protectedFrame.y, protectedFrame.w, protectedFrame.h, radius);
  drawCtx.lineWidth = protectedFrame.thickness;
  drawCtx.strokeStyle = protectedFrame.color;
  drawCtx.lineJoin = "round";
  drawCtx.stroke();
  drawCtx.restore();
}

function exportCameraMaskDataUrl() {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = cameraMaskCanvas.width;
  exportCanvas.height = cameraMaskCanvas.height;
  const exportCtx = exportCanvas.getContext("2d");
  exportCtx.drawImage(cameraMaskCanvas, 0, 0);
  drawProtectedFrame(exportCtx);
  return exportCanvas.toDataURL("image/png");
}

function exportCameraWorkDataUrl() {
  return cameraMaskCanvas.toDataURL("image/png");
}

function cameraEditorStatePayload() {
  return {
    protectedFrame,
    protectionStrokes: cloneProtectionStrokes(),
    protectionGuide,
    protectionGuideVisible,
    frameControls: {
      thickness: Number(frameThicknessInput?.value || protectedFrame.thickness || 4),
      radius: Number(frameRadiusInput?.value || protectedFrame.radius || 24),
      color: frameColorInput?.value || protectedFrame.color || "#111816"
    }
  };
}

function applyCameraEditorState(state = {}) {
  if (state.protectedFrame) protectedFrame = { ...protectedFrame, ...state.protectedFrame };
  if (Array.isArray(state.protectionStrokes)) {
    protectionStrokes = state.protectionStrokes
      .filter((stroke) => Array.isArray(stroke?.points) && stroke.points.length > 0)
      .slice(0, 200)
      .map((stroke) => ({
        size: clamp(Number(stroke.size || 34), 2, 160),
        points: stroke.points.slice(0, 4000).map((point) => [Number(point[0]), Number(point[1])])
      }));
  } else if (state.cameraRing?.protected) {
    // Keep the first version of the protection tool working after it becomes a stamped mark.
    protectionStrokes = [{
      size: Math.max(4, Number(state.cameraRing.radius ?? state.cameraRing.outer ?? 34) * 2),
      points: [[Number(state.cameraRing.x || 0), Number(state.cameraRing.y || 0)]]
    }];
  }
  if (state.protectionGuide) {
    protectionGuide = {
      x: Number(state.protectionGuide.x ?? protectionGuide.x),
      y: Number(state.protectionGuide.y ?? protectionGuide.y),
      radius: clamp(Number(state.protectionGuide.radius ?? protectionGuide.radius), 2, Math.min(cameraMaskCanvas.width, cameraMaskCanvas.height) / 2)
    };
  } else if (state.cameraRing) {
    protectionGuide = {
      x: Number(state.cameraRing.x ?? protectionGuide.x),
      y: Number(state.cameraRing.y ?? protectionGuide.y),
      radius: clamp(Number(state.cameraRing.radius ?? state.cameraRing.outer ?? protectionGuide.radius), 2, Math.min(cameraMaskCanvas.width, cameraMaskCanvas.height) / 2)
    };
  }
  protectionGuideVisible = state.protectionGuideVisible ?? true;
  rebuildProtectionMask();
  if (protectedFrameToggle) protectedFrameToggle.checked = Boolean(protectedFrame.enabled);
  if (frameThicknessInput) frameThicknessInput.value = String(state.frameControls?.thickness ?? protectedFrame.thickness ?? 4);
  if (frameRadiusInput) frameRadiusInput.value = String(state.frameControls?.radius ?? protectedFrame.radius ?? 24);
  if (frameColorInput) frameColorInput.value = state.frameControls?.color ?? protectedFrame.color ?? "#111816";
  protectedFrame.thickness = Number(frameThicknessInput?.value || protectedFrame.thickness || 4);
  protectedFrame.radius = Number(frameRadiusInput?.value || protectedFrame.radius || 24);
  protectedFrame.color = frameColorInput?.value || protectedFrame.color || "#111816";
  syncMaskToolButtons();
  updateRangeOutputs();
  updateCameraMaskPreview();
}

function drawGapHighlight() {
  if (!gapHighlightVisible || !cameraMaskCtx || !cameraToolOverlayCtx) return;
  const source = cameraMaskCtx.getImageData(0, 0, cameraMaskCanvas.width, cameraMaskCanvas.height);
  const highlight = cameraToolOverlayCtx.createImageData(cameraMaskCanvas.width, cameraMaskCanvas.height);

  for (let index = 0; index < source.data.length; index += 4) {
    const alpha = source.data[index + 3];
    if (alpha > 12) {
      highlight.data[index] = 178;
      highlight.data[index + 1] = 42;
      highlight.data[index + 2] = 255;
      highlight.data[index + 3] = 150;
    }
  }

  cameraToolOverlayCtx.putImageData(highlight, 0, 0);
}

function redrawToolOverlay() {
  if (!cameraToolOverlayCtx) return;
  cameraToolOverlayCtx.clearRect(0, 0, cameraToolOverlayCanvas.width, cameraToolOverlayCanvas.height);
  drawGapHighlight();

  if (protectedFrame.enabled) {
    cameraToolOverlayCtx.save();
    const radius = Math.min(protectedFrame.radius, protectedFrame.w / 2, protectedFrame.h / 2);
    roundedPathForContext(cameraToolOverlayCtx, protectedFrame.x, protectedFrame.y, protectedFrame.w, protectedFrame.h, radius);
    cameraToolOverlayCtx.lineWidth = Math.max(2, protectedFrame.thickness);
    cameraToolOverlayCtx.strokeStyle = protectedFrame.color;
    cameraToolOverlayCtx.stroke();
    cameraToolOverlayCtx.restore();
  }

  if (gapHighlightVisible && protectionStrokes.length > 0) {
    // Blue is an editor-only mark of the locked area, shown with the pink cleanup check.
    cameraToolOverlayCtx.save();
    cameraToolOverlayCtx.fillStyle = "rgba(37, 137, 214, 0.42)";
    cameraToolOverlayCtx.strokeStyle = "rgba(37, 137, 214, 0.42)";
    protectionStrokes.forEach((stroke) => drawProtectionStroke(cameraToolOverlayCtx, stroke));
    cameraToolOverlayCtx.restore();
  }

  if (protectionGuideVisible) {
    cameraToolOverlayCtx.save();
    cameraToolOverlayCtx.lineWidth = 1;
    cameraToolOverlayCtx.strokeStyle = "rgba(39, 112, 92, 0.95)";
    cameraToolOverlayCtx.beginPath();
    cameraToolOverlayCtx.arc(protectionGuide.x, protectionGuide.y, protectionGuide.radius, 0, Math.PI * 2);
    cameraToolOverlayCtx.stroke();
    cameraToolOverlayCtx.fillStyle = "rgba(39, 112, 92, 0.95)";
    cameraToolOverlayCtx.beginPath();
    cameraToolOverlayCtx.arc(protectionGuide.x, protectionGuide.y, 1.5, 0, Math.PI * 2);
    cameraToolOverlayCtx.fill();
    cameraToolOverlayCtx.restore();
  }
}

function undoEraser() {
  const previous = eraserHistory.pop();
  if (!previous || !cameraMaskCtx) return;
  eraserRedoHistory.push({
    mask: cameraMaskCtx.getImageData(0, 0, cameraMaskCanvas.width, cameraMaskCanvas.height),
    protectionStrokes: cloneProtectionStrokes()
  });
  cameraMaskCtx.clearRect(0, 0, cameraMaskCanvas.width, cameraMaskCanvas.height);
  cameraMaskCtx.putImageData(previous.mask, 0, 0);
  protectionStrokes = previous.protectionStrokes || [];
  rebuildProtectionMask();
  cameraMaskDirty = true;
  updateCameraMaskPreview();
}

function redoEraser() {
  const next = eraserRedoHistory.pop();
  if (!next || !cameraMaskCtx) return;
  eraserHistory.push({
    mask: cameraMaskCtx.getImageData(0, 0, cameraMaskCanvas.width, cameraMaskCanvas.height),
    protectionStrokes: cloneProtectionStrokes()
  });
  cameraMaskCtx.clearRect(0, 0, cameraMaskCanvas.width, cameraMaskCanvas.height);
  cameraMaskCtx.putImageData(next.mask, 0, 0);
  protectionStrokes = next.protectionStrokes || [];
  rebuildProtectionMask();
  cameraMaskDirty = true;
  updateCameraMaskPreview();
}

function resetCameraMaskToOriginal() {
  if (!eraserOriginalImageData || !cameraMaskCtx) return;
  pushEraserHistory();
  cameraMaskCtx.clearRect(0, 0, cameraMaskCanvas.width, cameraMaskCanvas.height);
  cameraMaskCtx.putImageData(eraserOriginalImageData, 0, 0);
  protectionStrokes = [];
  rebuildProtectionMask();
  cameraMaskDirty = true;
  updateCameraMaskPreview();
}

function updateCameraMaskPreview() {
  if (!cameraMaskCanvas) return;
  redrawToolOverlay();
  cameraMaskImage = new Image();
  cameraMaskImage.onload = renderAdminModelPreview;
  cameraMaskImage.src = exportCameraMaskDataUrl();
}

function openCameraMaskEditor(image, { markDirty = true } = {}) {
  if (!cameraMaskCanvas || !cameraMaskCtx || !image) return;
  resizeMaskCanvasForImage(image);
  cameraMaskCtx.clearRect(0, 0, cameraMaskCanvas.width, cameraMaskCanvas.height);
  cameraMaskCtx.globalCompositeOperation = "source-over";
  cameraMaskCtx.drawImage(image, 0, 0, cameraMaskCanvas.width, cameraMaskCanvas.height);
  eraserOriginalImageData = cameraMaskCtx.getImageData(0, 0, cameraMaskCanvas.width, cameraMaskCanvas.height);
  if (maskZoomInput) maskZoomInput.value = "100";
  updateMaskCanvasDisplay();
  resetFrameAndRingTools();
  resetEraserHistory();
  gapHighlightVisible = false;
  syncMaskToolButtons();
  updateRangeOutputs();
  updateCameraMaskPreview();
  cameraMaskDirty = markDirty;
}

function ensureProtectionMask() {
  if (!cameraMaskCanvas) return;
  if (!protectionMaskCanvas) {
    protectionMaskCanvas = document.createElement("canvas");
    protectionMaskCtx = protectionMaskCanvas.getContext("2d", { willReadFrequently: true });
  }
  if (protectionMaskCanvas.width !== cameraMaskCanvas.width || protectionMaskCanvas.height !== cameraMaskCanvas.height) {
    protectionMaskCanvas.width = cameraMaskCanvas.width;
    protectionMaskCanvas.height = cameraMaskCanvas.height;
  }
}

function drawProtectionStroke(drawCtx, stroke) {
  const points = stroke?.points || [];
  if (!points.length) return;
  const size = Math.max(2, Number(stroke.size || 34));
  drawCtx.lineWidth = size;
  drawCtx.lineCap = "round";
  drawCtx.lineJoin = "round";
  drawCtx.beginPath();
  drawCtx.moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length; index += 1) {
    drawCtx.lineTo(points[index][0], points[index][1]);
  }
  drawCtx.stroke();
  if (points.length === 1) {
    drawCtx.beginPath();
    drawCtx.arc(points[0][0], points[0][1], size / 2, 0, Math.PI * 2);
    drawCtx.fill();
  }
}

function rebuildProtectionMask() {
  ensureProtectionMask();
  if (!protectionMaskCtx || !protectionMaskCanvas) return;
  protectionMaskCtx.clearRect(0, 0, protectionMaskCanvas.width, protectionMaskCanvas.height);
  protectionMaskCtx.save();
  protectionMaskCtx.fillStyle = "#fff";
  protectionMaskCtx.strokeStyle = "#fff";
  protectionStrokes.forEach((stroke) => drawProtectionStroke(protectionMaskCtx, stroke));
  protectionMaskCtx.restore();
}

function eraserCanvasPoint(event) {
  const rect = cameraMaskCanvas.getBoundingClientRect();
  const pointer = event.touches ? event.touches[0] : event;
  return {
    x: (pointer.clientX - rect.left) * (cameraMaskCanvas.width / rect.width),
    y: (pointer.clientY - rect.top) * (cameraMaskCanvas.height / rect.height)
  };
}

function eraseAt(point) {
  const size = Number(eraserSizeInput?.value || 34);
  const hardness = Number(eraserHardnessInput?.value || 82) / 100;
  const radius = size / 2;
  const hardRadius = Math.max(0, radius * hardness);
  const gradient = cameraMaskCtx.createRadialGradient(point.x, point.y, hardRadius, point.x, point.y, radius);
  gradient.addColorStop(0, "rgba(0,0,0,1)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");

  const left = Math.max(0, Math.floor(point.x - radius - 1));
  const top = Math.max(0, Math.floor(point.y - radius - 1));
  const right = Math.min(cameraMaskCanvas.width, Math.ceil(point.x + radius + 1));
  const bottom = Math.min(cameraMaskCanvas.height, Math.ceil(point.y + radius + 1));
  const width = Math.max(1, right - left);
  const height = Math.max(1, bottom - top);
  const before = protectionMaskCtx ? cameraMaskCtx.getImageData(left, top, width, height) : null;

  cameraMaskCtx.save();
  cameraMaskCtx.globalCompositeOperation = "destination-out";
  cameraMaskCtx.fillStyle = gradient;
  cameraMaskCtx.beginPath();
  cameraMaskCtx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  cameraMaskCtx.fill();
  cameraMaskCtx.restore();

  if (before && protectionMaskCtx) {
    const protectedPixels = protectionMaskCtx.getImageData(left, top, width, height);
    const after = cameraMaskCtx.getImageData(left, top, width, height);
    for (let index = 0; index < protectedPixels.data.length; index += 4) {
      if (protectedPixels.data[index + 3] > 0) {
        after.data[index] = before.data[index];
        after.data[index + 1] = before.data[index + 1];
        after.data[index + 2] = before.data[index + 2];
        after.data[index + 3] = before.data[index + 3];
      }
    }
    cameraMaskCtx.putImageData(after, left, top);
  }
}

function frameDragAction(point) {
  const handleSize = 24;
  const right = protectedFrame.x + protectedFrame.w;
  const bottom = protectedFrame.y + protectedFrame.h;
  if (Math.abs(point.x - right) <= handleSize && Math.abs(point.y - bottom) <= handleSize) return "resize-frame";
  if (point.x >= protectedFrame.x && point.x <= right && point.y >= protectedFrame.y && point.y <= bottom) return "move-frame";
  return "move-frame";
}

function protectionGuideDragAction(point) {
  const distance = Math.hypot(point.x - protectionGuide.x, point.y - protectionGuide.y);
  return Math.abs(distance - protectionGuide.radius) <= 12 ? "resize-protection-guide" : "move-protection-guide";
}

function stampProtectionGuide() {
  if (!cameraMaskCtx) return;
  pushEraserHistory();
  if (protectionStrokes.length >= 200) protectionStrokes.shift();
  protectionStrokes.push({
    size: protectionGuide.radius * 2,
    points: [[Math.round(protectionGuide.x * 10) / 10, Math.round(protectionGuide.y * 10) / 10]]
  });
  rebuildProtectionMask();
  syncMaskToolButtons();
  redrawToolOverlay();
  modelAdminMessage.textContent = "Защитная метка поставлена. Внутри круга ластик больше не работает.";
}

function startEraser(event) {
  if (!cameraMaskCtx) return;
  event.preventDefault();
  const point = eraserCanvasPoint(event);

  if (maskToolModeValue === "frame") {
    protectedFrame.enabled = true;
    if (protectedFrameToggle) protectedFrameToggle.checked = true;
    maskToolDrag = { action: frameDragAction(point), start: point, frame: { ...protectedFrame } };
    redrawToolOverlay();
    updateCameraMaskPreview();
    return;
  }

  if (maskToolModeValue === "protect") {
    if (!protectionGuideVisible) return;
    maskToolDrag = { action: protectionGuideDragAction(point), start: point, guide: { ...protectionGuide } };
    redrawToolOverlay();
    return;
  }

  eraserDrawing = true;
  pushEraserHistory();
  eraseAt(point);
  cameraMaskDirty = true;
  updateCameraMaskPreview();
}

function moveEraser(event) {
  if (!cameraMaskCtx) return;
  event.preventDefault();
  const point = eraserCanvasPoint(event);

  if (maskToolDrag?.action === "move-frame") {
    protectedFrame.x = clamp(maskToolDrag.frame.x + point.x - maskToolDrag.start.x, 0, cameraMaskCanvas.width - protectedFrame.w);
    protectedFrame.y = clamp(maskToolDrag.frame.y + point.y - maskToolDrag.start.y, 0, cameraMaskCanvas.height - protectedFrame.h);
    cameraMaskDirty = true;
    updateCameraMaskPreview();
    return;
  }

  if (maskToolDrag?.action === "resize-frame") {
    protectedFrame.w = clamp(maskToolDrag.frame.w + point.x - maskToolDrag.start.x, 24, cameraMaskCanvas.width - protectedFrame.x);
    protectedFrame.h = clamp(maskToolDrag.frame.h + point.y - maskToolDrag.start.y, 24, cameraMaskCanvas.height - protectedFrame.y);
    cameraMaskDirty = true;
    updateCameraMaskPreview();
    return;
  }

  if (maskToolDrag?.action === "move-protection-guide") {
    protectionGuide.x = clamp(maskToolDrag.guide.x + point.x - maskToolDrag.start.x, protectionGuide.radius, cameraMaskCanvas.width - protectionGuide.radius);
    protectionGuide.y = clamp(maskToolDrag.guide.y + point.y - maskToolDrag.start.y, protectionGuide.radius, cameraMaskCanvas.height - protectionGuide.radius);
    redrawToolOverlay();
    return;
  }

  if (maskToolDrag?.action === "resize-protection-guide") {
    protectionGuide.radius = clamp(Math.hypot(point.x - protectionGuide.x, point.y - protectionGuide.y), 2, Math.min(cameraMaskCanvas.width, cameraMaskCanvas.height) / 2);
    redrawToolOverlay();
    return;
  }

  if (eraserDrawing) {
    eraseAt(point);
    cameraMaskDirty = true;
    updateCameraMaskPreview();
  }
}

function stopEraser() {
  eraserDrawing = false;
  maskToolDrag = null;
}

function pathRound(drawCtx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  drawCtx.beginPath();
  drawCtx.moveTo(x + radius, y);
  drawCtx.arcTo(x + w, y, x + w, y + h, radius);
  drawCtx.arcTo(x + w, y + h, x, y + h, radius);
  drawCtx.arcTo(x, y + h, x, y, radius);
  drawCtx.arcTo(x, y, x + w, y, radius);
  drawCtx.closePath();
}

function drawAdminLens(drawCtx, x, y, size) {
  drawCtx.fillStyle = "rgba(255,255,255,0.24)";
  drawCtx.beginPath();
  drawCtx.arc(x, y, size + 6, 0, Math.PI * 2);
  drawCtx.fill();
  drawCtx.fillStyle = "#111816";
  drawCtx.beginPath();
  drawCtx.arc(x, y, size, 0, Math.PI * 2);
  drawCtx.fill();
  drawCtx.fillStyle = "#39515b";
  drawCtx.beginPath();
  drawCtx.arc(x - size * 0.2, y - size * 0.2, size * 0.45, 0, Math.PI * 2);
  drawCtx.fill();
  drawCtx.fillStyle = "rgba(255,255,255,0.76)";
  drawCtx.beginPath();
  drawCtx.arc(x - size * 0.38, y - size * 0.42, size * 0.15, 0, Math.PI * 2);
  drawCtx.fill();
}

function drawAdminFlash(drawCtx, x, y) {
  drawCtx.fillStyle = "#f8e8a8";
  drawCtx.strokeStyle = "rgba(23, 32, 27, 0.16)";
  drawCtx.lineWidth = 2;
  drawCtx.beginPath();
  drawCtx.arc(x, y, 9, 0, Math.PI * 2);
  drawCtx.fill();
  drawCtx.stroke();
}

function drawAdminIsland(drawCtx, x, y, w, h, r) {
  pathRound(drawCtx, x, y, w, h, r);
  drawCtx.fillStyle = "rgba(245, 247, 241, 0.92)";
  drawCtx.fill();
  drawCtx.lineWidth = 3;
  drawCtx.strokeStyle = "rgba(23, 32, 27, 0.14)";
  drawCtx.stroke();
}

function drawAdminCamera(drawCtx, rect, camera, layout = {}) {
  drawCtx.save();
  const cameraOffsetX = Number(layout.cameraOffsetX ?? 0);
  const cameraOffsetY = Number(layout.cameraOffsetY ?? 0);
  const cameraScale = Number(layout.cameraScale ?? 1) || 1;
  const localRect = { x: 0, y: 0, w: rect.w, h: rect.h, r: rect.r };
  drawCtx.translate(rect.x + cameraOffsetX, rect.y + cameraOffsetY);
  drawCtx.scale(cameraScale, cameraScale);
  const x = 44;
  const y = 44;

  if (camera === "iphone-pro") {
    drawAdminIsland(drawCtx, x - 14, y - 14, 128, 128, 34);
    drawAdminLens(drawCtx, x + 25, y + 24, 21);
    drawAdminLens(drawCtx, x + 78, y + 24, 21);
    drawAdminLens(drawCtx, x + 52, y + 77, 21);
    drawAdminFlash(drawCtx, x + 92, y + 72);
  }
  if (camera === "iphone-dual") {
    drawAdminIsland(drawCtx, x - 10, y - 10, 98, 116, 30);
    drawAdminLens(drawCtx, x + 39, y + 24, 22);
    drawAdminLens(drawCtx, x + 39, y + 76, 22);
    drawAdminFlash(drawCtx, x + 72, y + 50);
  }
  if (camera === "iphone-dual-diagonal") {
    drawAdminIsland(drawCtx, x - 10, y - 10, 112, 112, 30);
    drawAdminLens(drawCtx, x + 26, y + 27, 22);
    drawAdminLens(drawCtx, x + 74, y + 75, 22);
    drawAdminFlash(drawCtx, x + 74, y + 30);
  }
  if (camera === "samsung-ultra") {
    drawAdminLens(drawCtx, x + 18, y + 18, 21);
    drawAdminLens(drawCtx, x + 18, y + 76, 21);
    drawAdminLens(drawCtx, x + 76, y + 18, 18);
    drawAdminLens(drawCtx, x + 76, y + 76, 18);
    drawAdminFlash(drawCtx, x + 47, y + 47);
  }
  if (camera === "samsung-line") {
    drawAdminLens(drawCtx, x + 26, y + 20, 20);
    drawAdminLens(drawCtx, x + 26, y + 72, 20);
    drawAdminLens(drawCtx, x + 26, y + 124, 20);
    drawAdminFlash(drawCtx, x + 72, y + 72);
  }
  if (camera === "samsung-s24-fe") {
    drawAdminLens(drawCtx, x + 18, y + 18, 22);
    drawAdminLens(drawCtx, x + 18, y + 78, 22);
    drawAdminLens(drawCtx, x + 18, y + 138, 22);
    drawAdminFlash(drawCtx, x + 78, y + 50);
  }
  if (camera === "xiaomi-square") {
    drawAdminIsland(drawCtx, x - 12, y - 12, 122, 122, 26);
    drawAdminLens(drawCtx, x + 25, y + 25, 21);
    drawAdminLens(drawCtx, x + 76, y + 25, 21);
    drawAdminLens(drawCtx, x + 25, y + 76, 21);
    drawAdminFlash(drawCtx, x + 77, y + 77);
  }
  if (camera === "redmi-panel") {
    drawAdminIsland(drawCtx, x - 12, y - 12, 132, 150, 28);
    drawAdminLens(drawCtx, x + 28, y + 30, 23);
    drawAdminLens(drawCtx, x + 84, y + 30, 19);
    drawAdminLens(drawCtx, x + 28, y + 88, 19);
    drawAdminFlash(drawCtx, x + 84, y + 88);
  }
  if (camera === "pixel-bar") {
    drawAdminIsland(drawCtx, localRect.x + 28, localRect.y + 54, localRect.w - 56, 74, 28);
    drawAdminLens(drawCtx, localRect.x + 92, localRect.y + 91, 21);
    drawAdminLens(drawCtx, localRect.x + 148, localRect.y + 91, 18);
    drawAdminFlash(drawCtx, localRect.x + localRect.w - 86, localRect.y + 91);
  }
  if (camera === "oneplus-circle") {
    drawCtx.fillStyle = "rgba(245, 247, 241, 0.9)";
    drawCtx.strokeStyle = "rgba(23, 32, 27, 0.16)";
    drawCtx.lineWidth = 3;
    drawCtx.beginPath();
    drawCtx.arc(x + 64, y + 64, 62, 0, Math.PI * 2);
    drawCtx.fill();
    drawCtx.stroke();
    drawAdminLens(drawCtx, x + 40, y + 45, 19);
    drawAdminLens(drawCtx, x + 86, y + 45, 19);
    drawAdminLens(drawCtx, x + 64, y + 88, 19);
    drawAdminFlash(drawCtx, x + 88, y + 88);
  }
  drawCtx.restore();
}

function renderAdminModelPreview() {
  if (!adminModelPreview) return;
  const model = readAdminModelForm();
  const width = adminModelPreview.width;
  const height = adminModelPreview.height;
  adminPreviewCtx.clearRect(0, 0, width, height);

  const gradient = adminPreviewCtx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#fff7e6");
  gradient.addColorStop(1, "#d9f1ea");
  adminPreviewCtx.fillStyle = gradient;
  adminPreviewCtx.fillRect(0, 0, width, height);

  const scale = Math.min((width - 72) / model.w, (height - 54) / model.h);
  const drawW = model.w * scale;
  const drawH = model.h * scale;
  const x = (width - drawW) / 2;
  const y = (height - drawH) / 2;
  const editingModel = models.find((item) => item.id === editingModelId);
  const phonePreview = adminPhoneImage || loadCachedImage(editingModel?.phoneImageUrl, renderAdminModelPreview);
  const cameraPreview = cameraMaskImage || loadCachedImage(editingModel?.cameraMaskUrl, renderAdminModelPreview);

  if (phonePreview || cameraPreview) {
    adminPreviewCtx.save();
    adminPreviewCtx.translate(x, y);
    adminPreviewCtx.scale(scale, scale);
    const rect = { x: 0, y: 0, w: model.w, h: model.h, r: model.r };
    pathRound(adminPreviewCtx, rect.x, rect.y, rect.w, rect.h, rect.r);
    adminPreviewCtx.clip();
    adminPreviewCtx.fillStyle = "#eef2ec";
    adminPreviewCtx.fillRect(rect.x, rect.y, rect.w, rect.h);
    if (phonePreview) adminPreviewCtx.drawImage(phonePreview, rect.x, rect.y, rect.w, rect.h);
    if (adminPreviewTestImage && adminPreviewShowTestImage?.checked) {
      adminPreviewCtx.save();
      pathRound(adminPreviewCtx, rect.x, rect.y, rect.w, rect.h, rect.r);
      adminPreviewCtx.clip();
      adminPreviewCtx.globalAlpha = 0.86;
      adminPreviewCtx.drawImage(adminPreviewTestImage, rect.x, rect.y, rect.w, rect.h);
      adminPreviewCtx.restore();
    }
    if (cameraPreview && adminPreviewShowCamera?.checked !== false) drawUploadedCameraMask(adminPreviewCtx, cameraPreview, rect, model);
    const frameWidth = clamp(Number(model.frameWidth ?? 18), 0, 18);
    if (frameWidth > 0) {
      pathRound(adminPreviewCtx, 0, 0, model.w, model.h, model.r);
      adminPreviewCtx.lineWidth = frameWidth;
      adminPreviewCtx.strokeStyle = "rgba(255, 255, 255, 0.88)";
      adminPreviewCtx.stroke();
    }
    adminPreviewCtx.restore();

    adminPreviewCtx.save();
    adminPreviewCtx.translate(x, y);
    adminPreviewCtx.scale(scale, scale);
    pathRound(adminPreviewCtx, 0, 0, model.w, model.h, model.r);
    adminPreviewCtx.lineWidth = 5;
    adminPreviewCtx.strokeStyle = "rgba(23, 32, 27, 0.28)";
    adminPreviewCtx.stroke();
    adminPreviewCtx.restore();
    return;
  }

  adminPreviewCtx.save();
  adminPreviewCtx.translate(x, y);
  adminPreviewCtx.scale(scale, scale);
  const rect = { x: 0, y: 0, w: model.w, h: model.h, r: model.r };
  pathRound(adminPreviewCtx, rect.x, rect.y, rect.w, rect.h, rect.r);
  const bodyGradient = adminPreviewCtx.createLinearGradient(0, 0, rect.w, rect.h);
  bodyGradient.addColorStop(0, model.color);
  bodyGradient.addColorStop(1, model.logo === "samsung" ? "#1f1f1f" : "#fffdf6");
  adminPreviewCtx.fillStyle = bodyGradient;
  adminPreviewCtx.fill();
  adminPreviewCtx.lineWidth = 12;
  adminPreviewCtx.strokeStyle = "rgba(255,255,255,0.88)";
  adminPreviewCtx.stroke();
  adminPreviewCtx.lineWidth = 4;
  adminPreviewCtx.strokeStyle = "rgba(23, 32, 27, 0.24)";
  adminPreviewCtx.stroke();
  if (model.logo === "samsung") {
    adminPreviewCtx.fillStyle = "rgba(18, 18, 17, 0.42)";
    adminPreviewCtx.font = "800 22px Manrope, sans-serif";
    adminPreviewCtx.textAlign = "center";
    adminPreviewCtx.fillText("SAMSUNG", rect.w / 2, rect.h - 132);
  }
  drawAdminCamera(adminPreviewCtx, rect, model.camera, model);
  adminPreviewCtx.restore();
}

function resetModelEditor() {
  editingModelId = null;
  adminModelForm.reset();
  adminPhoneImage = null;
  adminPreviewTestImage = null;
  usePhoneImageForCamera = false;
  cameraMaskImage = null;
  cameraMaskDirty = false;
  resetEraserHistory();
  if (cameraMaskCtx) cameraMaskCtx.clearRect(0, 0, cameraMaskCanvas.width, cameraMaskCanvas.height);
  if (cameraToolOverlayCtx) cameraToolOverlayCtx.clearRect(0, 0, cameraToolOverlayCanvas.width, cameraToolOverlayCanvas.height);
  protectedFrame.enabled = false;
  protectionGuideVisible = true;
  gapHighlightVisible = false;
  if (protectedFrameToggle) protectedFrameToggle.checked = false;
  syncMaskToolButtons();
  if (maskToolMode) maskToolMode.value = "eraser";
  maskToolModeValue = "eraser";
  if (phoneImageInput) phoneImageInput.required = true;
  if (cameraImageInput) cameraImageInput.required = false;
  adminModelForm.elements.cameraType.value = "uploaded";
  adminModelForm.elements.caseWidth.value = "330";
  adminModelForm.elements.caseHeight.value = "690";
  adminModelForm.elements.cornerRadius.value = "46";
  adminModelForm.elements.frameWidth.value = "18";
  adminModelForm.elements.color.value = "#d9e5f5";
  adminModelForm.elements.cameraOffsetX.value = "0";
  adminModelForm.elements.cameraOffsetY.value = "0";
  adminModelForm.elements.cameraScale.value = "100";
  if (modelCategorySelectAdmin) modelCategorySelectAdmin.value = "";
  if (adminModelForm.elements.inStock) adminModelForm.elements.inStock.checked = true;
  modelSubmitButton.textContent = "Добавить модель";
  cancelModelEditButton.classList.add("hidden");
  modelAdminMessage.textContent = "";
  updateRangeOutputs();
  renderAdminModelPreview();
}

function startModelEdit(model) {
  editingModelId = model.id;
  adminPhoneImage = null;
  adminPreviewTestImage = null;
  usePhoneImageForCamera = false;
  cameraMaskImage = null;
  cameraMaskDirty = false;
  resetEraserHistory();
  if (cameraMaskCtx) cameraMaskCtx.clearRect(0, 0, cameraMaskCanvas.width, cameraMaskCanvas.height);
  if (cameraToolOverlayCtx) cameraToolOverlayCtx.clearRect(0, 0, cameraToolOverlayCanvas.width, cameraToolOverlayCanvas.height);
  protectedFrame.enabled = false;
  protectionGuideVisible = true;
  gapHighlightVisible = false;
  if (protectedFrameToggle) protectedFrameToggle.checked = false;
  syncMaskToolButtons();
  if (maskToolMode) maskToolMode.value = "eraser";
  maskToolModeValue = "eraser";
  adminModelForm.elements.name.value = model.name;
  if (modelCategorySelectAdmin) modelCategorySelectAdmin.value = model.categoryId ? String(model.categoryId) : "";
  adminModelForm.elements.cameraType.value = model.camera || "uploaded";
  adminModelForm.elements.caseWidth.value = model.w;
  adminModelForm.elements.caseHeight.value = model.h;
  adminModelForm.elements.cornerRadius.value = model.r;
  adminModelForm.elements.frameWidth.value = String(model.frameWidth ?? 18);
  adminModelForm.elements.color.value = model.color || "#d9e5f5";
  adminModelForm.elements.logo.value = model.logo || "";
  adminModelForm.elements.cameraOffsetX.value = model.cameraOffsetX ?? 0;
  adminModelForm.elements.cameraOffsetY.value = model.cameraOffsetY ?? 0;
  adminModelForm.elements.cameraScale.value = String(Math.round(Number(model.cameraScale ?? 1) * 100));
  updateRangeOutputs();
  if (adminModelForm.elements.inStock) adminModelForm.elements.inStock.checked = !(model.inStock === false || model.inStock === 0 || model.inStock === "0");
  if (phoneImageInput) phoneImageInput.required = false;
  if (cameraImageInput) cameraImageInput.required = false;
  modelSubmitButton.textContent = "Сохранить модель";
  cancelModelEditButton.classList.remove("hidden");
  modelAdminMessage.textContent = "Загружаю сохраненное фото камер...";
  const editableCameraUrl = model.cameraWorkUrl || model.cameraImageUrl;
  if (editableCameraUrl) {
    loadImagePromise(displayImageUrl(editableCameraUrl))
      .then((image) => {
        if (editingModelId !== model.id) return;
        openCameraMaskEditor(image, { markDirty: false });
        applyCameraEditorState(model.cameraEditorState || {});
        cameraMaskDirty = false;
        modelAdminMessage.textContent = "Фото 2 загружено. Если изменить маску, обновится только финальный результат.";
      })
      .catch(() => {
        modelAdminMessage.textContent = "Не удалось загрузить сохраненное фото 2. Можно загрузить новое.";
      });
  } else {
    modelAdminMessage.textContent = "У этой модели нет сохраненного фото 2. Загрузите блок камер заново.";
  }
  renderAdminModelPreview();
  adminModelForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteModel(model) {
  if (!await confirmAction(`Удалить модель «${model.name}»? Макеты останутся, но без привязки к этой модели.`)) return;
  modelAdminMessage.textContent = "Удаляю модель...";
  try {
    await adminRequest(`/api/admin/models/${model.id}`, { method: "DELETE" });
    if (editingModelId === model.id) resetModelEditor();
    await refreshModelsAfterAdminMutation();
    modelAdminMessage.textContent = "Модель удалена.";
  } catch (error) {
    modelAdminMessage.textContent = error.message;
  }
}

async function loadAdminModels({ force = false } = {}) {
  if (!adminModelList) return;
  if (!currentUser || currentUser.role !== "admin") {
    adminModelsStatus.textContent = "...";
    return;
  }
  adminModelsStatus.textContent = "Загрузка...";
  try {
    await fetchModelCatalog({ force, admin: true });
    adminModels = [...modelCatalog];
    applyModelCatalogFilters();
    renderAdminModels();
  } catch (error) {
    adminModelsStatus.textContent = "Ошибка";
    modelAdminMessage.textContent = error.message;
  }
}

function renderAdminModels() {
  if (!adminModelList) return;
  adminModelList.innerHTML = "";
  const list = adminModels.length ? adminModels : models;
  adminModelsStatus.textContent = `${list.length}`;

  if (list.length === 0) {
    const empty = document.createElement("p");
    empty.className = "admin-empty";
    empty.textContent = "Моделей пока нет.";
    adminModelList.append(empty);
    return;
  }

  list.forEach((model) => {
    const item = document.createElement("article");
    item.className = "admin-list-item";

    const swatch = model.phoneImageUrl ? document.createElement("img") : document.createElement("span");
    if (model.phoneImageUrl) {
      swatch.src = displayImageUrl(model.phoneImageUrl);
      swatch.alt = "";
    } else {
      swatch.className = "model-swatch";
      swatch.style.background = model.color || "#d9e5f5";
    }

    const content = document.createElement("div");
    content.className = "admin-list-content";

    const title = document.createElement("strong");
    title.textContent = model.name;

    const meta = document.createElement("span");
    const corners = Number(model.r) === 0 ? "острые" : `скругление ${model.r}`;
    const stockText = (model.inStock === false || model.inStock === 0 || model.inStock === "0") ? "нет в наличии" : "в наличии";
    meta.textContent = model.phoneImageUrl
      ? `PNG-модель · ${model.w}x${model.h} · ${stockText} · маска камер ${model.cameraMaskUrl ? "готова" : "не задана"}`
      : `${model.camera} · ${model.w}x${model.h} · ${corners} · ${stockText}`;

    const actions = document.createElement("div");
    actions.className = "admin-list-actions";
    actions.append(
      createAdminButton("Открыть", "ghost mini-button", () => {
        selectModelById(model.id);
        render();
        setViewForRole("client", true);
      }),
      createAdminButton("Изменить", "ghost mini-button", () => startModelEdit(model)),
      createAdminButton("Удалить", "danger mini-button", () => deleteModel(model))
    );

    content.append(title, meta, actions);
    item.append(swatch, content);
    adminModelList.append(item);
  });
}

async function loadAdminUsers() {
  if (!currentUser || currentUser.role !== "admin" || !adminUserList) return;
  adminUsersStatus.textContent = "Загрузка...";
  try {
    adminUsers = await adminRequest("/api/admin/users");
    renderAdminUsers();
  } catch (error) {
    adminUsersStatus.textContent = "Ошибка";
    adminUsersMessage.textContent = error.message;
  }
}

function renderAdminUsers() {
  adminUserList.innerHTML = "";
  adminUsersStatus.textContent = `${adminUsers.length}`;
  if (adminUsers.length === 0) {
    const empty = document.createElement("p");
    empty.className = "admin-empty";
    empty.textContent = "Пользователей пока нет.";
    adminUserList.append(empty);
    return;
  }

  adminUsers.forEach((user) => {
    const item = document.createElement("article");
    item.className = "admin-list-item wide-list-item";
    const avatar = document.createElement("div");
    avatar.className = "role-avatar";
    avatar.textContent = user.role === "admin" ? "A" : user.role === "executor" ? "И" : "К";

    const content = document.createElement("div");
    content.className = "admin-list-content";
    const title = document.createElement("button");
    title.className = "link-button profile-link-button";
    title.type = "button";
    title.textContent = user.name;
    title.addEventListener("click", () => openPublicProfile(user.id));
    const meta = document.createElement("span");
    meta.textContent = `${user.email} · ${roleLabel(user.role)} · ${user.profilePublic ? "профиль открыт" : "профиль скрыт"}`;

    const actions = document.createElement("div");
    actions.className = "admin-list-actions";
    const roleSelect = document.createElement("select");
    roleSelect.className = "mini-select";
    [
      ["client", "Клиент"],
      ["executor", "Исполнитель"],
      ["admin", "Администратор"]
    ].forEach(([value, label]) => roleSelect.append(new Option(label, value)));
    roleSelect.value = user.role;

    const saveButton = createAdminButton("Назначить", "primary mini-button", async () => {
      adminUsersMessage.textContent = "Обновляю роль...";
      try {
        await adminRequest(`/api/admin/users/${user.id}/role`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: roleSelect.value })
        });
        adminUsersMessage.textContent = "Роль обновлена.";
        await loadAdminUsers();
      } catch (error) {
        adminUsersMessage.textContent = error.message;
      }
    });
    actions.append(roleSelect, saveButton);
    content.append(title, meta, actions);
    item.append(avatar, content);
    adminUserList.append(item);
  });
}

function orderStatusValue(order) {
  if (order.status) return order.status;
  if (order.productionStatus === "delivered") return "delivered";
  if (order.productionStatus === "shipped") return "shipped";
  if (order.paymentStatus === "paid") return "paid";
  return "new";
}

function orderStatusText(orderOrStatus) {
  const normalizedStatus = typeof orderOrStatus === "string" ? orderOrStatus : orderStatusValue(orderOrStatus);
  if (normalizedStatus === "cancelled") return "Отменен";
  if (normalizedStatus === "in_production") return "В производстве";
  if (normalizedStatus === "ready") return "Готов к отправке";
  if (normalizedStatus === "new") return "Ожидает оплаты";
  const status = typeof orderOrStatus === "string" ? orderOrStatus : orderStatusValue(orderOrStatus);
  if (status === "delivered") return "Доставлено";
  if (status === "shipped") return "Отправлено";
  if (status === "paid") return "Оплачено";
  return "Не оплачено";
}

function orderDisplayTitle(order) {
  return order.title || order.orderNumber || `Заказ #${order.id}`;
}

function orderItemsLabel(order) {
  const count = Number(order.itemsCount || order.quantity || 0) || 1;
  return `${count} шт.`;
}

function orderPriceLabel(order) {
  if (order.totalAmount === undefined || order.totalAmount === null || order.totalAmount === "") return "";
  return moneyLabel(order.totalAmount, order.currency || "RUB");
}

function profileOrderDateLabel(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
}

async function loadProfileOrders() {
  if (!currentUser || !profileOrdersList) return;
  profileOrdersStatus.textContent = "Загрузка...";
  try {
    const response = await fetch(apiUrl("/api/profile/orders"), { headers: authHeaders(), cache: "no-cache" });
    if (!response.ok) throw new Error("Не удалось загрузить заказы.");
    profileOrders = await response.json();
    renderProfileOrders();
  } catch (error) {
    profileOrders = [];
    profileOrdersStatus.textContent = "Ошибка";
    profileOrdersList.innerHTML = `<p class="admin-empty">${escapeHtml(error.message)}</p>`;
  }
}

function renderProfileOrders() {
  if (!profileOrdersList) return;
  const visibleOrders = profileOrderFilter === "all"
    ? profileOrders
    : profileOrders.filter((order) => orderStatusValue(order) === profileOrderFilter);
  profileOrdersStatus.textContent = `${visibleOrders.length}/${profileOrders.length}`;
  profileOrderFilters?.querySelectorAll("[data-profile-order-filter]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.profileOrderFilter === profileOrderFilter);
  });
  profileOrdersList.innerHTML = "";
  if (visibleOrders.length === 0) {
    const empty = document.createElement("p");
    empty.className = "admin-empty";
    empty.textContent = profileOrderFilter === "all" ? "Заказов пока нет." : "Заказов с этим статусом пока нет.";
    profileOrdersList.append(empty);
    return;
  }
  visibleOrders.forEach((order) => {
    const item = document.createElement("article");
    const status = orderStatusValue(order);
    item.className = "profile-order-card";
    const details = [
      order.modelName,
      orderItemsLabel(order),
      orderPriceLabel(order),
      profileOrderDateLabel(order.createdAt)
    ].filter(Boolean);
    item.innerHTML = `
      ${orderPreviewMarkup(order.previewWithCameraUrl)}
      <div class="profile-order-content">
        <div class="profile-order-topline">
          <strong>${escapeHtml(orderDisplayTitle(order))}</strong>
          <span class="profile-order-status status-${escapeHtml(status)}">${escapeHtml(orderStatusText(order))}</span>
        </div>
        <span>${escapeHtml(details.join(" · "))}</span>
        ${order.trackingNumber ? `<span>Трек-номер: ${escapeHtml(order.trackingNumber)}</span>` : ""}
      </div>
    `;
    profileOrdersList.append(item);
  });
}

async function toggleProfileOrders({ open = null } = {}) {
  if (!currentUser || !profileOrdersPanel) return;
  const shouldOpen = open ?? profileOrdersPanel.classList.contains("hidden");
  profileOrdersPanel.classList.toggle("hidden", !shouldOpen);
  profileOrdersToggleButton?.classList.toggle("is-active", shouldOpen);
  profileOrdersToggleButton.textContent = shouldOpen ? "Скрыть заказы" : "Мои заказы";
  if (shouldOpen) await loadProfileOrders();
}

function orderPreviewMarkup(src, fallback = "Нет превью") {
  const imageUrl = displayImageUrl(src);
  if (!imageUrl) return `<div class="executor-photo-placeholder order-preview-placeholder">${escapeHtml(fallback)}</div>`;
  return `<img src="${escapeHtml(imageUrl)}" alt="" loading="lazy" decoding="async">`;
}

function designStatusLabel(design) {
  if (design.paymentStatus !== "paid") return "Не оплачено";
  if (design.productionStatus === "delivered") return "Оплачено · доставлено";
  if (design.productionStatus === "shipped") return "Оплачено · отправлено";
  return "Оплачено · в работе";
}

function setIconButtonState(button, icon, label) {
  if (!button) return;
  button.textContent = icon;
  button.title = label;
  button.setAttribute("aria-label", label);
}

function syncMaskToolButtons() {
  setIconButtonState(toggleRingVisibilityButton, protectionGuideVisible ? "👁" : "◌", protectionGuideVisible ? "Скрыть защитный круг" : "Показать защитный круг");
  setIconButtonState(cutRingButton, "🛡", "Поставить защитную метку кругом");
  cutRingButton?.classList.remove("is-active");
  setIconButtonState(toggleGapHighlightButton, "●", gapHighlightVisible ? "Скрыть подсветку" : "Подсветить нестертое");
}

function setAvatarPreview(element, imageUrl, fallback = "?") {
  if (!element) return;
  element.innerHTML = "";
  if (imageUrl) {
    const image = document.createElement("img");
    decorateImage(image, { lazy: false });
    image.src = displayImageUrl(imageUrl);
    image.alt = "";
    element.append(image);
  } else {
    element.textContent = fallback;
  }
}

async function loadAvatarOptions({ force = false } = {}) {
  const cachedAvatars = readJsonCache(avatarOptionsCacheKey);
  if (!force && Array.isArray(cachedAvatars)) {
    avatarOptions = cachedAvatars;
    renderProfileAvatarOptions();
  }
  try {
    avatarOptions = await adminRequest("/api/avatars", { cache: force ? "no-cache" : "default" });
    writeJsonCache(avatarOptionsCacheKey, avatarOptions);
  } catch {
    if (!Array.isArray(cachedAvatars)) avatarOptions = [];
  }
  renderProfileAvatarOptions();
  preloadImages(avatarOptions.map((avatar) => avatar.imageUrl), 8);
}

function renderProfileAvatarOptions() {
  if (!profileAvatarList || !currentUser) return;
  setAvatarPreview(profileAvatarPreview, currentUser.avatarUrl, currentUser.name?.slice(0, 1) || "?");
  profileAvatarList.innerHTML = "";

  const clearButton = document.createElement("button");
  clearButton.className = `avatar-choice${currentUser.avatarOptionId ? "" : " is-selected"}`;
  clearButton.type = "button";
  clearButton.textContent = "Без аватарки";
  clearButton.addEventListener("click", () => updateProfileAvatar(null));
  profileAvatarList.append(clearButton);

  avatarOptions.forEach((avatar) => {
    const button = document.createElement("button");
    button.className = `avatar-choice${Number(currentUser.avatarOptionId) === Number(avatar.id) ? " is-selected" : ""}`;
    button.type = "button";
    button.title = avatar.title;
    button.innerHTML = `<img src="${displayImageUrl(avatar.imageUrl)}" alt="" loading="lazy" decoding="async"><span>${escapeHtml(avatar.title)}</span>`;
    button.addEventListener("click", () => updateProfileAvatar(avatar.id));
    profileAvatarList.append(button);
  });
}

async function updateProfileAvatar(avatarOptionId) {
  if (!currentUser) return;
  try {
    const result = await adminRequest("/api/profile/avatar", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarOptionId })
    });
    currentUser = result.user;
    storeSession(localStorage.getItem(tokenKey), currentUser);
    updateAuthUi();
    renderProfileAvatarOptions();
    profileAvatarList?.classList.add("hidden");
  } catch (error) {
    profileMeta.textContent = error.message;
    }
  }

function toggleProfileAvatarList() {
  profileAvatarList?.classList.toggle("hidden");
}

async function loadAdminAvatars() {
  if (!currentUser || currentUser.role !== "admin" || !adminAvatarList) return;
  adminAvatarsStatus.textContent = "Загрузка...";
  adminAvatarsMessage.textContent = "";
  try {
    adminAvatars = await adminRequest("/api/admin/avatars");
    adminAvatarsStatus.textContent = `${adminAvatars.filter((avatar) => avatar.isActive).length}`;
    renderAdminAvatars();
  } catch (error) {
    adminAvatarsStatus.textContent = "Ошибка";
    adminAvatarsMessage.textContent = error.message;
  }
}

function renderAdminAvatars() {
  adminAvatarList.innerHTML = "";
  const activeAvatars = adminAvatars.filter((avatar) => avatar.isActive);
  if (activeAvatars.length === 0) {
    const empty = document.createElement("p");
    empty.className = "admin-empty";
    empty.textContent = "Аватарок пока нет.";
    adminAvatarList.append(empty);
    return;
  }

  activeAvatars.forEach((avatar) => {
    const item = document.createElement("article");
    item.className = "admin-list-item avatar-admin-card";
    item.innerHTML = `
      <img src="${displayImageUrl(avatar.imageUrl)}" alt="" loading="lazy" decoding="async">
      <div class="admin-list-content">
        <strong>${escapeHtml(avatar.title)}</strong>
        <span>Доступна пользователям</span>
      </div>
    `;

    const actions = document.createElement("div");
    actions.className = "admin-list-actions";
    const deleteButton = createAdminButton("Удалить", "danger mini-button", async () => {
      adminAvatarsMessage.textContent = "Удаляю аватарку...";
      try {
        await adminRequest(`/api/admin/avatars/${avatar.id}`, { method: "DELETE" });
        adminAvatarsMessage.textContent = "Аватарка удалена.";
        await loadAdminAvatars();
        await loadAvatarOptions({ force: true });
      } catch (error) {
        adminAvatarsMessage.textContent = error.message;
      }
    });
    actions.append(deleteButton);
    item.querySelector(".admin-list-content").append(actions);
    adminAvatarList.append(item);
  });
}

const avatarEditorState = {
  image: null,
  sourceUrl: "",
  scale: 1,
  x: 0,
  y: 0,
  dragging: false,
  lastX: 0,
  lastY: 0
};

function resetAvatarEditor({ keepImage = false } = {}) {
  if (!keepImage) {
    avatarEditorState.image = null;
    if (avatarEditorState.sourceUrl) URL.revokeObjectURL(avatarEditorState.sourceUrl);
    avatarEditorState.sourceUrl = "";
  }
  avatarEditorState.scale = 1;
  avatarEditorState.x = 0;
  avatarEditorState.y = 0;
  if (adminAvatarScale) adminAvatarScale.value = "100";
  renderAvatarEditor();
}

function avatarCanvasPoint(event) {
  const rect = adminAvatarCanvas.getBoundingClientRect();
  const pointer = event.touches ? event.touches[0] : event;
  return {
    x: (pointer.clientX - rect.left) * (adminAvatarCanvas.width / rect.width),
    y: (pointer.clientY - rect.top) * (adminAvatarCanvas.height / rect.height)
  };
}

function renderAvatarEditor() {
  if (!adminAvatarCanvas) return;
  const drawCtx = adminAvatarCanvas.getContext("2d");
  const size = adminAvatarCanvas.width;
  const center = size / 2;
  drawCtx.clearRect(0, 0, size, size);
  drawCtx.save();
  drawCtx.beginPath();
  drawCtx.arc(center, center, center - 2, 0, Math.PI * 2);
  drawCtx.clip();
  drawCtx.fillStyle = "#eef3e9";
  drawCtx.fillRect(0, 0, size, size);
  if (avatarEditorState.image) {
    const image = avatarEditorState.image;
    const coverScale = Math.max(size / image.width, size / image.height);
    const drawScale = coverScale * avatarEditorState.scale;
    const drawW = image.width * drawScale;
    const drawH = image.height * drawScale;
    drawCtx.drawImage(
      image,
      center - drawW / 2 + avatarEditorState.x,
      center - drawH / 2 + avatarEditorState.y,
      drawW,
      drawH
    );
  } else {
    drawCtx.fillStyle = "rgba(23, 32, 27, 0.56)";
    drawCtx.font = "800 17px Manrope, sans-serif";
    drawCtx.textAlign = "center";
    drawCtx.fillText("Выберите фото", center, center + 6);
  }
  drawCtx.restore();
  drawCtx.lineWidth = 5;
  drawCtx.strokeStyle = "rgba(23, 32, 27, 0.16)";
  drawCtx.beginPath();
  drawCtx.arc(center, center, center - 3, 0, Math.PI * 2);
  drawCtx.stroke();
}

async function loadAvatarEditorFile(file) {
  if (!file) {
    resetAvatarEditor();
    return;
  }
  if (avatarEditorState.sourceUrl) URL.revokeObjectURL(avatarEditorState.sourceUrl);
  const sourceUrl = URL.createObjectURL(file);
  try {
    avatarEditorState.image = await loadImagePromise(sourceUrl);
    avatarEditorState.sourceUrl = sourceUrl;
    resetAvatarEditor({ keepImage: true });
  } catch {
    URL.revokeObjectURL(sourceUrl);
    resetAvatarEditor();
    adminAvatarsMessage.textContent = "Не удалось открыть изображение аватарки.";
  }
}

function avatarEditorDataUrl() {
  if (!adminAvatarCanvas || !avatarEditorState.image) return "";
  return adminAvatarCanvas.toDataURL("image/png");
}

async function submitAdminAvatar(event) {
  event.preventDefault();
  if (!avatarEditorState.image) {
    adminAvatarsMessage.textContent = "Выберите изображение аватарки.";
    return;
  }

  const formData = new FormData(adminAvatarForm);
  formData.set("image", dataUrlToFile(avatarEditorDataUrl(), "avatar.png"));
  adminAvatarSubmitButton.disabled = true;
  adminAvatarsMessage.textContent = "Загружаю аватарку...";
  try {
    await adminRequest("/api/admin/avatars", { method: "POST", body: formData });
    adminAvatarForm.reset();
    resetAvatarEditor();
    adminAvatarsMessage.textContent = "Аватарка добавлена.";
    await loadAdminAvatars();
    await loadAvatarOptions({ force: true });
  } catch (error) {
    adminAvatarsMessage.textContent = error.message;
  } finally {
    adminAvatarSubmitButton.disabled = false;
  }
}

async function loadAdminOrdersPanel() {
  if (!currentUser || currentUser.role !== "admin" || !adminOrderList) return;
  if (adminUsers.length === 0) await loadAdminUsers();
  if (adminModels.length === 0) await loadAdminModels();

  if (adminOrderUserSelect) {
    const selectedValue = adminOrderUserSelect.value;
    adminOrderUserSelect.innerHTML = "";
    adminOrderUserSelect.append(new Option("Все пользователи", ""));
    adminUsers.forEach((user) => {
      adminOrderUserSelect.append(new Option(`${user.name} · ${user.email}`, String(user.id)));
    });
    adminOrderUserSelect.value = selectedValue && [...adminOrderUserSelect.options].some((option) => option.value === selectedValue)
      ? selectedValue
      : "";
  }

  if (adminOrderModelSelect) {
    const selectedValue = adminOrderModelSelect.value;
    adminOrderModelSelect.innerHTML = "";
    adminOrderModelSelect.append(new Option("Все модели", ""));
    const modelOptions = adminModels.length ? adminModels : models;
    modelOptions.forEach((model) => {
      adminOrderModelSelect.append(new Option(model.name, String(model.id)));
    });
    adminOrderModelSelect.value = selectedValue && [...adminOrderModelSelect.options].some((option) => option.value === selectedValue)
      ? selectedValue
      : "";
  }

  await loadAdminOrders();
}

async function loadAdminOrders() {
  if (!adminOrderList) return;
  const userId = adminOrderUserSelect?.value || "";
  const phoneModelId = adminOrderModelSelect?.value || "";
  const sort = adminOrderDateSort?.value || "desc";
  const params = new URLSearchParams();
  if (userId) params.set("userId", userId);
  if (phoneModelId) params.set("phoneModelId", phoneModelId);
  params.set("sort", sort);
  adminOrdersStatus.textContent = "Загрузка...";
  adminOrdersMessage.textContent = "";
  try {
    adminOrders = await adminRequest(`/api/admin/orders?${params.toString()}`);
    renderAdminOrders();
  } catch (error) {
    adminOrdersStatus.textContent = "Ошибка";
    adminOrdersMessage.textContent = error.message;
  }
}

function renderAdminOrders() {
  adminOrderList.innerHTML = "";
  adminOrdersStatus.textContent = `${adminOrders.length}`;
  if (adminOrders.length === 0) {
    const empty = document.createElement("p");
    empty.className = "admin-empty";
    empty.textContent = "Заказов у выбранного пользователя пока нет.";
    adminOrderList.append(empty);
    return;
  }

  adminOrders.forEach((order) => {
    const item = document.createElement("article");
    item.className = "admin-list-item admin-order-card";

    const imageUrl = displayImageUrl(order.previewWithCameraUrl);
    const preview = imageUrl ? document.createElement("img") : document.createElement("div");
    if (imageUrl) {
      preview.src = imageUrl;
      preview.alt = "";
    } else {
      preview.className = "executor-photo-placeholder order-preview-placeholder";
      preview.textContent = "Нет превью";
    }

    const content = document.createElement("div");
    content.className = "admin-list-content";
    const title = document.createElement("strong");
    title.textContent = orderDisplayTitle(order);
    const meta = document.createElement("span");
    const metaParts = [
      order.modelName || "Модель не выбрана",
      orderItemsLabel(order),
      orderPriceLabel(order),
      orderStatusText(order)
    ].filter(Boolean);
    meta.innerHTML = `${escapeHtml(metaParts.join(" · "))} · <button class="link-button profile-link-button" type="button">${escapeHtml(order.customerName || "Клиент")}</button>`;
    meta.querySelector("button")?.addEventListener("click", () => openPublicProfile(order.userId));

    const actions = document.createElement("div");
    actions.className = "admin-list-actions";
    const statusSelect = document.createElement("select");
    statusSelect.className = "mini-select";
    const normalizedStatus = orderStatusValue(order);
    if (order.paymentStatus !== "paid" && normalizedStatus !== "cancelled") {
      statusSelect.append(new Option("Ожидает оплаты", "new"));
    }
    const statusOptions = [
      ["in_production", "В производстве"],
      ["ready", "Готов к отправке"],
      ["shipped", "Отправлено"],
      ["delivered", "Доставлено"],
      ["cancelled", "Отменен"]
    ];
    statusOptions.forEach(([value, label]) => statusSelect.append(new Option(label, value)));
    statusSelect.value = normalizedStatus === "paid" ? "in_production" : normalizedStatus;

    const saveButton = createAdminButton("Сохранить статус", "primary mini-button", async () => {
      adminOrdersMessage.textContent = "Обновляю статус...";
      try {
        await adminRequest(`/api/admin/orders/${order.id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: statusSelect.value })
        });
        adminOrdersMessage.textContent = "Статус обновлен.";
        await loadAdminOrders();
      } catch (error) {
        adminOrdersMessage.textContent = error.message;
      }
    });
    const syncSaveButton = () => {
      saveButton.disabled = statusSelect.value === "new";
    };
    statusSelect.addEventListener("change", syncSaveButton);
    syncSaveButton();

    actions.append(statusSelect, saveButton);
    content.append(title, meta, actions);
    item.append(preview, content);
    adminOrderList.append(item);
  });
}

function analyticsNumber(value) {
  return Number(value || 0);
}

function analyticsMoney(value) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(analyticsNumber(value))) + " ₽";
}

function analyticsCompactMoney(value) {
  const amount = analyticsNumber(value);
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(amount >= 10000000 ? 0 : 1)} млн ₽`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(amount >= 100000 ? 0 : 1)} тыс. ₽`;
  return `${Math.round(amount)} ₽`;
}

function analyticsEmpty(mount, text = "За выбранный период данных пока нет.") {
  if (mount) mount.innerHTML = `<p class="analytics-empty">${escapeHtml(text)}</p>`;
}

function analyticsDelta(current, previous) {
  const now = analyticsNumber(current);
  const before = analyticsNumber(previous);
  if (!before) return now ? "Есть первые продажи в периоде" : "Нет данных для сравнения";
  const percent = Math.round(((now - before) / before) * 100);
  return `${percent > 0 ? "+" : ""}${percent}% к прошлому периоду`;
}

function analyticsKpiMarkup(label, value, detail, tone = "") {
  return `<article class="analytics-kpi"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small class="${tone}">${escapeHtml(detail)}</small></article>`;
}

function renderAnalyticsKpis(summary) {
  if (!analyticsKpis) return;
  const revenue = analyticsNumber(summary.revenue);
  const paidOrders = analyticsNumber(summary.paidOrders);
  const totalOrders = analyticsNumber(summary.totalOrders);
  const delivered = analyticsNumber(summary.deliveredOrders);
  const revenueDelta = analyticsDelta(summary.currentRevenue, summary.previousRevenue);
  const ordersDelta = analyticsDelta(summary.currentPaidOrders, summary.previousPaidOrders);
  const revenueTone = analyticsNumber(summary.currentRevenue) >= analyticsNumber(summary.previousRevenue) ? "positive" : "negative";
  const ordersTone = analyticsNumber(summary.currentPaidOrders) >= analyticsNumber(summary.previousPaidOrders) ? "positive" : "negative";
  const deliveryRate = paidOrders ? Math.round((delivered / paidOrders) * 100) : 0;
  analyticsKpis.innerHTML = [
    analyticsKpiMarkup("Выручка", analyticsMoney(revenue), revenueDelta, revenueTone),
    analyticsKpiMarkup("Оплачено заказов", String(paidOrders), ordersDelta, ordersTone),
    analyticsKpiMarkup("Средний чек", paidOrders ? analyticsMoney(revenue / paidOrders) : "0 ₽", "по оплаченным заказам"),
    analyticsKpiMarkup("Доставлено", `${deliveryRate}%`, `${delivered} из ${paidOrders || 0} оплаченных`)
  ].join("");
  if (!totalOrders && !paidOrders) analyticsKpis.querySelectorAll("small").forEach((item) => { item.textContent = "Нет заказов в выбранном периоде"; });
}

function analyticsTrendPoint(values, index, value, max, width, height, padding) {
  const x = padding.left + (index / Math.max(1, values.length - 1)) * (width - padding.left - padding.right);
  const y = padding.top + (1 - value / Math.max(1, max)) * (height - padding.top - padding.bottom);
  return [x, y];
}

function analyticsDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderAnalyticsTrend(rows, days) {
  if (!analyticsTrendChart) return;
  const byDate = new Map(rows.map((row) => [row.date, row]));
  const data = Array.from({ length: days }, (_item, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - 1 - index));
    const key = analyticsDateKey(date);
    const row = byDate.get(key) || {};
    return { date, revenue: analyticsNumber(row.revenue), orders: analyticsNumber(row.paidOrders) };
  });
  if (!data.some((row) => row.revenue || row.orders)) return analyticsEmpty(analyticsTrendChart);
  const width = 900;
  const height = 280;
  const padding = { left: 52, right: 52, top: 22, bottom: 37 };
  const maxRevenue = Math.max(...data.map((row) => row.revenue), 1);
  const maxOrders = Math.max(...data.map((row) => row.orders), 1);
  const revenuePoints = data.map((row, index) => analyticsTrendPoint(data, index, row.revenue, maxRevenue, width, height, padding));
  const orderPoints = data.map((row, index) => analyticsTrendPoint(data, index, row.orders, maxOrders, width, height, padding));
  const toPath = (points) => points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const chartBottom = height - padding.bottom;
  const areaPath = `${toPath(revenuePoints)} L${revenuePoints.at(-1)[0].toFixed(1)},${chartBottom} L${revenuePoints[0][0].toFixed(1)},${chartBottom} Z`;
  const ticks = [0, 0.5, 1].map((fraction) => {
    const y = padding.top + (1 - fraction) * (height - padding.top - padding.bottom);
    return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="rgba(23,32,27,.12)"/><text x="0" y="${y + 4}">${escapeHtml(analyticsCompactMoney(maxRevenue * fraction))}</text>`;
  }).join("");
  const labelIndexes = days <= 31 ? [0, 7, 14, 21, days - 1] : [0, Math.floor(days / 4), Math.floor(days / 2), Math.floor(days * 0.75), days - 1];
  const labels = [...new Set(labelIndexes)].map((index) => {
    const [x] = revenuePoints[index];
    return `<text x="${x}" y="${height - 10}" text-anchor="middle">${data[index].date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</text>`;
  }).join("");
  const dots = days <= 31 ? revenuePoints.map(([x, y], index) => `<circle cx="${x}" cy="${y}" r="3" fill="#f06b34"><title>${data[index].date.toLocaleDateString("ru-RU")}: ${analyticsMoney(data[index].revenue)}</title></circle>`).join("") : "";
  analyticsTrendChart.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="График выручки и количества оплаченных заказов по дням"><title>Выручка и количество оплаченных заказов по дням</title><defs><linearGradient id="analyticsRevenueFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f06b34" stop-opacity=".28"/><stop offset="1" stop-color="#f06b34" stop-opacity=".02"/></linearGradient></defs>${ticks}<path d="${areaPath}" fill="url(#analyticsRevenueFill)"/><path d="${toPath(revenuePoints)}" fill="none" stroke="#f06b34" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${dots}<path d="${toPath(orderPoints)}" fill="none" stroke="#337e9d" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="5 5"/>${labels}<text x="${width - 4}" y="17" text-anchor="end">заказы: максимум ${maxOrders}</text></svg><div class="analytics-legend"><span><i style="background:#f06b34"></i>Выручка</span><span><i style="background:#337e9d"></i>Оплаченные заказы</span></div>`;
  if (analyticsTrendCaption) analyticsTrendCaption.textContent = `${days} дней`;
}

function renderAnalyticsStatus(rows) {
  if (!analyticsStatusChart) return;
  const labels = { new: "Ожидают оплаты", paid: "Оплачены", in_production: "В производстве", ready: "Готовы", shipped: "Отправлены", delivered: "Доставлены", cancelled: "Отменены" };
  const colors = { new: "#91c9e8", paid: "#f2ad48", in_production: "#8a6ec8", ready: "#5a9b6b", shipped: "#3c86a8", delivered: "#398447", cancelled: "#c86b5c" };
  const values = rows.filter((row) => analyticsNumber(row.count) > 0);
  const total = values.reduce((sum, row) => sum + analyticsNumber(row.count), 0);
  if (!total) return analyticsEmpty(analyticsStatusChart);
  let offset = 0;
  const circles = values.map((row) => {
    const fraction = analyticsNumber(row.count) / total;
    const dash = `${(fraction * 100).toFixed(3)} ${(100 - fraction * 100).toFixed(3)}`;
    const circle = `<circle cx="50" cy="50" r="37" fill="none" stroke="${colors[row.status] || "#64706a"}" stroke-width="15" pathLength="100" stroke-dasharray="${dash}" stroke-dashoffset="${(-offset).toFixed(3)}" transform="rotate(-90 50 50)"><title>${escapeHtml(labels[row.status] || row.status)}: ${analyticsNumber(row.count)}</title></circle>`;
    offset += fraction * 100;
    return circle;
  }).join("");
  const list = values.map((row) => `<div class="analytics-status-item" style="--status-color:${colors[row.status] || "#64706a"}"><span>${escapeHtml(labels[row.status] || row.status)}</span><b>${analyticsNumber(row.count)}</b></div>`).join("");
  analyticsStatusChart.innerHTML = `<div class="analytics-donut-wrap"><svg class="analytics-donut" viewBox="0 0 100 100" role="img" aria-label="Распределение ${total} заказов по статусам"><title>Статусы заказов</title>${circles}<text x="50" y="48" text-anchor="middle" style="font-size:16px;fill:var(--ink)">${total}</text><text x="50" y="61" text-anchor="middle">заказов</text></svg><div class="analytics-status-list">${list}</div></div>`;
}

function renderAnalyticsBars(mount, rows, { empty = "Продаж по моделям пока нет.", label = (row) => row.name, value = (row) => row.count } = {}) {
  if (!mount) return;
  const max = Math.max(...rows.map((row) => analyticsNumber(value(row))), 0);
  if (!max) return analyticsEmpty(mount, empty);
  mount.innerHTML = `<div class="analytics-bars">${rows.map((row) => {
    const amount = analyticsNumber(value(row));
    return `<div class="analytics-bar-row"><span>${escapeHtml(label(row))}</span><div class="analytics-bar-track"><div class="analytics-bar-fill" style="width:${Math.max(4, amount / max * 100)}%"></div></div><b>${amount}</b></div>`;
  }).join("")}</div>`;
}

function renderAnalyticsWeekdays(rows) {
  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const counts = Array.from({ length: 7 }, (_item, index) => analyticsNumber(rows.find((row) => Number(row.weekday) === index)?.count));
  if (!counts.some(Boolean)) return analyticsEmpty(analyticsWeekdaysChart, "Оплаченных заказов по дням недели пока нет.");
  const max = Math.max(...counts, 1);
  const bars = counts.map((count, index) => {
    const height = (count / max) * 145;
    const x = 26 + index * 51;
    return `<rect x="${x}" y="${172 - height}" width="30" height="${height}" rx="8" fill="${index > 4 ? "#f2ad48" : "#f06b34"}"><title>${dayNames[index]}: ${count} заказов</title></rect><text x="${x + 15}" y="192" text-anchor="middle">${dayNames[index]}</text><text x="${x + 15}" y="${164 - height}" text-anchor="middle">${count}</text>`;
  }).join("");
  analyticsWeekdaysChart.innerHTML = `<svg viewBox="0 0 390 210" role="img" aria-label="Количество оплаченных заказов по дням недели"><title>Оплаченные заказы по дням недели</title><line x1="16" y1="172" x2="378" y2="172" stroke="rgba(23,32,27,.16)"/>${bars}</svg>`;
}

function renderAnalyticsFunnel(funnel) {
  const steps = [
    { name: "Создано", value: analyticsNumber(funnel.created) },
    { name: "Оплачено", value: analyticsNumber(funnel.paid) },
    { name: "В производстве", value: analyticsNumber(funnel.production) },
    { name: "Отправлено", value: analyticsNumber(funnel.shipped) },
    { name: "Доставлено", value: analyticsNumber(funnel.delivered) }
  ];
  renderAnalyticsBars(analyticsFunnelChart, steps, { empty: "Заказов для воронки пока нет.", label: (row) => row.name, value: (row) => row.value });
}

function renderAdminAnalytics(data) {
  renderAnalyticsKpis(data.summary || {});
  renderAnalyticsTrend(data.trend || [], Number(data.days || 30));
  renderAnalyticsStatus(data.statuses || []);
  renderAnalyticsBars(analyticsModelsChart, data.models || []);
  renderAnalyticsWeekdays(data.weekdays || []);
  renderAnalyticsFunnel(data.funnel || {});
}

async function loadAdminAnalytics() {
  if (!currentUser || currentUser.role !== "admin" || !analyticsKpis) return;
  const days = Number(analyticsPeriodSelect?.value || 30);
  analyticsMessage.textContent = "Загружаю показатели…";
  try {
    const data = await adminRequest(`/api/admin/analytics?days=${[30, 90, 365].includes(days) ? days : 30}`, { cache: "no-cache" });
    renderAdminAnalytics(data);
    analyticsMessage.textContent = `Данные обновлены · ${new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
  } catch (error) {
    analyticsMessage.textContent = error.message || "Не удалось загрузить аналитику.";
    [analyticsTrendChart, analyticsStatusChart, analyticsModelsChart, analyticsWeekdaysChart, analyticsFunnelChart].forEach((mount) => analyticsEmpty(mount, "Не удалось загрузить данные."));
  }
}

function applyTemplateCatalogFilters({ demo = false } = {}) {
  templates = templateCatalog.filter((template) => (
    !selectedTemplateCategoryId || String(template.categoryId || "") === String(selectedTemplateCategoryId)
  ));
  templatesStatus.textContent = demo ? "Демо" : `${templates.length}`;
  renderTemplates();
  renderAdminTemplates();
  preloadImages(templates.map((template) => template.imageUrl), 10);
}

async function fetchTemplateCatalog({ force = false } = {}) {
  if (!force && templateCatalogLoaded) return templateCatalog;
  if (templateCatalogRequest) return templateCatalogRequest;

  templateCatalogRequest = (async () => {
    const response = await fetch(apiUrl("/api/templates"), { cache: force ? "no-cache" : "default" });
    if (!response.ok) throw new Error("API is unavailable");
    templateCatalog = await response.json();
    templateCatalogLoaded = true;
    writeJsonCache(templatesCacheKey, templateCatalog);
    return templateCatalog;
  })().finally(() => {
    templateCatalogRequest = null;
  });
  return templateCatalogRequest;
}

async function loadTemplates({ force = false } = {}) {
  if (!templateCatalogLoaded) templatesStatus.textContent = "Загрузка...";
  try {
    await fetchTemplateCatalog({ force });
    applyTemplateCatalogFilters();
  } catch {
    if (!templateCatalog.length) {
      templateCatalog = fallbackTemplates.map((template) => ({ ...template, modelName: null }));
    }
    applyTemplateCatalogFilters({ demo: !templateCatalogLoaded });
  }
}

async function refreshModelsAfterAdminMutation({ refreshTemplates = true } = {}) {
  const tasks = [
    loadAdminModels({ force: true }),
    loadCategories({ force: true }),
    loadAdminCategories({ force: true, type: "models" })
  ];
  if (refreshTemplates) tasks.push(loadTemplates({ force: true }));
  await Promise.allSettled(tasks);
}

async function refreshTemplatesAfterAdminMutation() {
  await Promise.allSettled([
    loadTemplates({ force: true }),
    loadCategories({ force: true }),
    loadAdminCategories({ force: true, type: "templates" })
  ]);
}

function restoreCachedTemplates() {
  const cachedTemplates = readJsonCache(templatesCacheKey);
  if (Array.isArray(cachedTemplates) && cachedTemplates.length > 0) {
    templateCatalog = cachedTemplates;
    templates = [...templateCatalog];
  }
  renderTemplates();
  renderAdminTemplates();
  preloadImages(templates.map((template) => template.imageUrl), 10);
}

function applyStickerCatalogFilters() {
  stickers = stickerCatalog.filter((sticker) => (
    !selectedStickerCategoryId || String(sticker.categoryId || "") === String(selectedStickerCategoryId)
  ));
  if (stickersStatus) stickersStatus.textContent = String(stickers.length);
  renderStickers();
  preloadImages(stickers.map((sticker) => sticker.imageUrl), 12);
}

async function fetchStickerCatalog({ force = false } = {}) {
  if (!force && stickerCatalogLoaded) return stickerCatalog;
  if (stickerCatalogRequest) return stickerCatalogRequest;
  stickerCatalogRequest = (async () => {
    const response = await fetch(apiUrl("/api/stickers"), { cache: force ? "no-cache" : "default" });
    if (!response.ok) throw new Error("Не удалось загрузить стикеры.");
    stickerCatalog = await response.json();
    stickerCatalogLoaded = true;
    writeJsonCache(stickersCacheKey, stickerCatalog);
    return stickerCatalog;
  })().finally(() => {
    stickerCatalogRequest = null;
  });
  return stickerCatalogRequest;
}

async function loadStickers({ force = false } = {}) {
  if (!stickerCatalogLoaded && stickersStatus) stickersStatus.textContent = "Загрузка...";
  try {
    await fetchStickerCatalog({ force });
    applyStickerCatalogFilters();
  } catch {
    if (stickersStatus) stickersStatus.textContent = stickerCatalog.length ? String(stickerCatalog.length) : "Недоступно";
    applyStickerCatalogFilters();
  }
}

async function loadAdminStickers({ force = false } = {}) {
  if (!currentUser || currentUser.role !== "admin" || !adminStickerList) return;
  if (!force && adminStickersLoaded) {
    renderAdminStickers();
    return adminStickers;
  }
  if (adminStickersRequest) return adminStickersRequest;
  adminStickersStatus.textContent = "Загрузка...";
  adminStickersRequest = adminRequest("/api/admin/stickers", { cache: "no-store" })
    .then((rows) => {
      adminStickers = Array.isArray(rows) ? rows : [];
      adminStickersLoaded = true;
      renderAdminStickers();
      return adminStickers;
    })
    .catch((error) => {
      adminStickersStatus.textContent = "Ошибка";
      stickerAdminMessage.textContent = error.message || "Не удалось загрузить стикеры.";
      throw error;
    })
    .finally(() => {
      adminStickersRequest = null;
    });
  return adminStickersRequest;
}

async function refreshStickersAfterAdminMutation() {
  await Promise.allSettled([
    loadStickers({ force: true }),
    loadAdminStickers({ force: true }),
    loadCategories({ force: true }),
    loadAdminCategories({ force: true, type: "stickers" })
  ]);
}

function restoreCachedStickers() {
  const cachedStickers = readJsonCache(stickersCacheKey);
  if (Array.isArray(cachedStickers)) {
    stickerCatalog = cachedStickers;
    stickers = [...stickerCatalog];
  }
  applyStickerCatalogFilters();
}

async function loadProfileDesigns() {
  if (!currentUser) return;
  const cacheKey = profileDesignsCacheKey();
  const cachedDesigns = readJsonCache(cacheKey);
  if (Array.isArray(cachedDesigns)) {
    savedDesigns = cachedDesigns;
    selectedProfileDesignIds = new Set([...selectedProfileDesignIds].filter((id) => savedDesigns.some((design) => design.id === id)));
    profileDesignsStatus.textContent = `${savedDesigns.length}`;
    renderProfileDesigns();
  }
  profileDesignsStatus.textContent = "Загрузка...";
  try {
    const response = await fetch(apiUrl("/api/profile/designs"), { headers: authHeaders(), cache: "no-cache" });
    if (!response.ok) throw new Error("Не удалось загрузить работы.");
    savedDesigns = await response.json();
    designDetailCache.clear();
    if (cacheKey) writeJsonCache(cacheKey, savedDesigns);
    selectedProfileDesignIds = new Set([...selectedProfileDesignIds].filter((id) => savedDesigns.some((design) => design.id === id)));
    profileDesignsStatus.textContent = `${savedDesigns.length}`;
    renderProfileDesigns();
  } catch (error) {
    if (!Array.isArray(cachedDesigns)) {
    profileDesignsStatus.textContent = "Ошибка";
    profileMeta.textContent = error.message;
  }
}
}

function selectedProfileDesigns() {
  return savedDesigns.filter((design) => selectedProfileDesignIds.has(design.id));
}

function hasProfileDesignDetail(design) {
  return Boolean(design && Object.prototype.hasOwnProperty.call(design, "sourceImages") && Object.prototype.hasOwnProperty.call(design, "designState"));
}

async function loadProfileDesignDetail(design) {
  if (!design?.id) return design;
  if (hasProfileDesignDetail(design)) return design;
  const cachedDetail = designDetailCache.get(design.id);
  if (cachedDetail) return cachedDetail;

  const result = await adminRequest(`/api/profile/designs/${design.id}`, { cache: "no-cache" });
  const detail = { ...design, ...(result.design || result) };
  designDetailCache.set(design.id, detail);
  const index = savedDesigns.findIndex((item) => item.id === design.id);
  if (index >= 0) savedDesigns[index] = detail;
  return detail;
}

function renderProfileDesignSources(design) {
  const sources = parseJsonObject(design?.sourceImages);
  const sourceList = Array.isArray(sources) ? sources : [];
  profileSourceImages.innerHTML = "";
  sourceList.forEach((source) => {
    if (!source.sourceUrl) return;
    const image = document.createElement("img");
    decorateImage(image);
    image.src = displayImageUrl(source.sourceUrl);
    image.alt = "";
    profileSourceImages.append(image);
  });
  preloadImages(sourceList.map((source) => source.sourceUrl), 6);
}

function refreshProfileCards() {
  profileDesignList.querySelectorAll(".profile-design-card").forEach((card) => {
    const designId = Number(card.dataset.designId);
    card.classList.toggle("is-active", designId === activeProfileDesignId);
    card.classList.toggle("is-selected", selectedProfileDesignIds.has(designId));
  });
}

function updateProfileSelectionActions() {
  const count = selectedProfileDesignIds.size;
  if (selectedDesignsCount) selectedDesignsCount.textContent = `Выбрано: ${count}`;
  profileSelectionBar?.classList.toggle("hidden", count < 2);
  if (paySelectedDesignsButton) paySelectedDesignsButton.disabled = count < 2;
  if (deleteSelectedDesignsButton) deleteSelectedDesignsButton.disabled = count < 2;
  profileSingleActions?.classList.toggle("hidden", count !== 1);
  refreshProfileCards();
}

function selectOnlyProfileDesign(design) {
  selectedProfileDesignIds = new Set([design.id]);
  showProfileDesign(design);
  updateProfileSelectionActions();
}

function addProfileDesignToSelection(design) {
  selectedProfileDesignIds.add(design.id);
  showProfileDesign(design);
  updateProfileSelectionActions();
}

function selectProfileDesignRange(startIndex, endIndex) {
  if (startIndex < 0 || endIndex < 0) return;
  const from = Math.min(startIndex, endIndex);
  const to = Math.max(startIndex, endIndex);
  const range = savedDesigns.slice(from, to + 1);
  selectedProfileDesignIds = new Set(range.map((design) => design.id));
  const activeDesign = savedDesigns[endIndex] || range[range.length - 1];
  if (activeDesign) showProfileDesign(activeDesign);
  updateProfileSelectionActions();
}

function profileDesignIndexFromPoint(clientX, clientY) {
  const card = document.elementFromPoint(clientX, clientY)?.closest?.(".profile-design-card");
  if (!card || !profileDesignList.contains(card)) return -1;
  return Number(card.dataset.designIndex);
}

function handleProfileRangeMove(event) {
  if (!profileSelectionDrag.active) return;
  const index = profileDesignIndexFromPoint(event.clientX, event.clientY);
  if (index < 0 || index === profileSelectionDrag.currentIndex) return;
  profileSelectionDrag.currentIndex = index;
  selectProfileDesignRange(profileSelectionDrag.startIndex, index);
}

function renderProfileDesigns() {
  profileDesignList.innerHTML = "";
  if (savedDesigns.length === 0) {
    profileDesignList.innerHTML = `<p class="admin-empty">Сохраненных работ пока нет.</p>`;
    profilePreviewCamera.removeAttribute("src");
    profilePreviewDesign.removeAttribute("src");
    profileSourceImages.innerHTML = "";
    updateProfileSelectionActions();
    return;
  }

  savedDesigns.forEach((design, index) => {
    const card = document.createElement("div");
    const isSelected = selectedProfileDesignIds.has(design.id);
    card.className = `profile-design-card${design.id === activeProfileDesignId ? " is-active" : ""}${isSelected ? " is-selected" : ""}`;
    card.setAttribute("role", "button");
    card.dataset.designId = String(design.id);
    card.dataset.designIndex = String(index);
    card.tabIndex = 0;
    let touchTap = null;
    card.innerHTML = `
      <img src="${displayImageUrl(design.previewWithCameraUrl)}" alt="" loading="lazy" decoding="async">
      <strong>${design.title}</strong>
      <span>${design.modelName || "Модель не выбрана"}</span>
      <span>${designStatusLabel(design)}</span>
    `;
    card.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      if (event.pointerType !== "mouse") {
        touchTap = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          moved: false
        };
        return;
      }
      event.preventDefault();
      profileSelectionDrag = { active: true, startIndex: index, currentIndex: index };
      selectProfileDesignRange(index, index);
    });
    card.addEventListener("pointermove", (event) => {
      if (!touchTap || event.pointerId !== touchTap.pointerId) return;
      const distance = Math.hypot(event.clientX - touchTap.startX, event.clientY - touchTap.startY);
      if (distance > profileTapMovementTolerance) touchTap.moved = true;
    });
    card.addEventListener("pointerup", (event) => {
      if (!touchTap || event.pointerId !== touchTap.pointerId) return;
      const shouldSelect = !touchTap.moved;
      touchTap = null;
      if (!shouldSelect) return;
      event.preventDefault();
      window.setTimeout(() => {
        if (card.isConnected) selectOnlyProfileDesign(design);
      }, 0);
    });
    ["pointercancel", "lostpointercapture"].forEach((eventName) => {
      card.addEventListener(eventName, () => {
        touchTap = null;
      });
    });
    card.addEventListener("pointerenter", () => {
      if (!profileSelectionDrag.active) return;
      profileSelectionDrag.currentIndex = index;
      selectProfileDesignRange(profileSelectionDrag.startIndex, index);
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectOnlyProfileDesign(design);
      }
    });
    profileDesignList.append(card);
  });

  if (!activeProfileDesignId) showProfileDesign(savedDesigns[0]);
  updateProfileSelectionActions();
}

function showProfileDesign(design) {
  activeProfileDesignId = design.id;
  profilePreviewCamera.src = displayImageUrl(design.previewWithCameraUrl);
  profilePreviewDesign.src = displayImageUrl(design.designWithoutCameraUrl);
  renderProfileDesignSources(design);
  loadProfileDesignDetail(design)
    .then((detail) => {
      if (activeProfileDesignId === design.id) renderProfileDesignSources(detail);
    })
    .catch(() => {
      if (activeProfileDesignId === design.id) profileSourceImages.innerHTML = "";
    });
  refreshProfileCards();
}

function openCheckoutDialog(designs) {
  return new Promise((resolve) => {
    const existing = document.querySelector("#checkoutDialog");
    if (existing) existing.remove();
    const dialog = document.createElement("dialog");
    dialog.className = "profile-dialog";
    dialog.id = "checkoutDialog";
    const total = designs.reduce((sum, design) => {
      const model = models.find((item) => Number(item.id) === Number(design.phoneModelId));
      return sum + Number(model?.retailPrice ?? defaultCasePrice);
    }, 0);
    const modelNames = designs.map((design) => {
      const model = models.find((item) => Number(item.id) === Number(design.phoneModelId));
      return model?.name || design.modelName || "Персональный чехол";
    });
    dialog.innerHTML = `
      <form class="profile-card checkout-card" method="dialog">
        <button class="dialog-close" value="cancel" type="submit" aria-label="Закрыть">×</button>
        <p class="eyebrow">Оформление</p>
        <h2>Куда доставить заказ?</h2>
        <div class="checkout-summary">
          <span>${escapeHtml(modelNames.join(", "))} · ${designs.length} шт.</span>
          <strong>${moneyLabel(total)}</strong>
        </div>
        <div class="checkout-fields">
          <label><span>Имя получателя</span><input name="name" type="text" autocomplete="name" placeholder="Как к вам обращаться" value="${escapeHtml(currentUser?.name || "")}" required></label>
          <label><span>Телефон</span><input name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="+7 900 000-00-00" required></label>
          <label class="wide"><span>Email для информации о заказе</span><input name="email" type="email" autocomplete="email" placeholder="name@example.com" value="${escapeHtml(currentUser?.email || "")}" required></label>
          <label><span>Город</span><input name="city" type="text" autocomplete="address-level2" placeholder="Например, Владивосток" required></label>
          <label><span>Почтовый индекс</span><input name="postalCode" type="text" autocomplete="postal-code" inputmode="numeric" placeholder="690000"></label>
          <label class="wide"><span>Адрес или пункт выдачи</span><input name="address" type="text" autocomplete="street-address" placeholder="Улица, дом, квартира или адрес пункта выдачи" required></label>
          <label class="wide"><span>Комментарий к заказу</span><textarea name="comment" rows="3" placeholder="Необязательно"></textarea></label>
        </div>
        <p class="checkout-note">После проверки данных будет создан заказ и откроется безопасная страница оплаты. Итоговая сумма перед оплатой будет показана ещё раз.</p>
        <div class="checkout-consents">
          <label class="legal-consent">
            <input name="termsAccepted" type="checkbox" required>
            <span>Я принимаю условия <a href="/offer" target="_blank" rel="noopener">публичной оферты</a>, <a href="/delivery" target="_blank" rel="noopener">доставки</a> и <a href="/returns" target="_blank" rel="noopener">возврата</a>.</span>
          </label>
          <label class="legal-consent">
            <input name="privacyAccepted" type="checkbox" required>
            <span>Я даю согласие на обработку персональных данных в соответствии с <a href="/privacy" target="_blank" rel="noopener">политикой</a>.</span>
          </label>
        </div>
        <button class="primary" value="submit" type="submit">Перейти к оплате</button>
        <button class="ghost" value="cancel" type="submit">Отмена</button>
      </form>
    `;
    document.body.append(dialog);
    dialog.addEventListener("close", () => {
      if (dialog.returnValue !== "submit") {
        dialog.remove();
        resolve(null);
        return;
      }
      const formData = new FormData(dialog.querySelector("form"));
      const result = {
        recipient: {
          name: String(formData.get("name") || "").trim(),
          phone: String(formData.get("phone") || "").trim(),
          email: String(formData.get("email") || "").trim(),
          city: String(formData.get("city") || "").trim(),
          address: String(formData.get("address") || "").trim(),
          postalCode: String(formData.get("postalCode") || "").trim()
        },
        customerComment: String(formData.get("comment") || "").trim(),
        termsAccepted: formData.get("termsAccepted") === "on",
        privacyAccepted: formData.get("privacyAccepted") === "on",
        legalVersion: "2026-07-29"
      };
      dialog.remove();
      resolve(result);
    }, { once: true });
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  });
}

function categoryFormPayload(form) {
  const formData = new FormData(form);
  return {
    name: String(formData.get("name") || "").trim(),
    isActive: formData.get("isActive") === "1"
  };
}

async function refreshCategoriesAfterAdminMutation(endpoint) {
  const isModelCategory = endpoint.includes("phone-model-categories");
  const isStickerCategory = endpoint.includes("sticker-categories");
  const catalogRefresh = isModelCategory
    ? loadAdminModels({ force: true })
    : isStickerCategory
      ? Promise.all([loadStickers({ force: true }), loadAdminStickers({ force: true })])
      : loadTemplates({ force: true });
  await Promise.allSettled([
    loadCategories({ force: true }),
    loadAdminCategories({ force: true, type: isModelCategory ? "models" : isStickerCategory ? "stickers" : "templates" }),
    catalogRefresh
  ]);
}

function renderAdminCategoryList({ list, status, categories, form, message, endpoint }) {
  if (!list) return;
  list.innerHTML = "";
  if (status) status.textContent = String(categories.length);
  categories.forEach((category) => {
    const item = document.createElement("article");
    item.className = "admin-list-item wide-list-item";
    const content = document.createElement("div");
    content.className = "admin-list-content";
    const title = document.createElement("strong");
    title.textContent = category.name;
    const meta = document.createElement("span");
    meta.textContent = `${category.slug} · ${category.itemsCount || 0} шт.`;
    const actions = document.createElement("div");
    actions.className = "admin-list-actions";
    actions.append(
      createAdminButton("Изменить", "ghost mini-button", () => {
        form.dataset.editingId = String(category.id);
        form.elements.name.value = category.name;
        form.elements.isActive.checked = category.isActive !== false;
        message.textContent = "Редактирование категории.";
      }),
      createAdminButton("Удалить", "danger mini-button", async () => {
        if (!await confirmAction(`Удалить категорию «${category.name}»? Все элементы останутся, но будут без категории.`)) return;
        message.textContent = "Удаляю категорию...";
        try {
          await adminRequest(`${endpoint}/${category.id}`, { method: "DELETE" });
          message.textContent = "Категория удалена.";
          await refreshCategoriesAfterAdminMutation(endpoint);
        } catch (error) {
          message.textContent = error.message;
        }
      })
    );
    content.append(title, meta, actions);
    item.append(content);
    list.append(item);
  });
}

function renderAdminCategoryLists() {
  renderAdminCategoryList({
    list: adminModelCategoryList,
    status: adminModelCategoriesStatus,
    categories: adminPhoneModelCategories,
    form: adminModelCategoryForm,
    message: modelCategoryMessage,
    endpoint: "/api/admin/phone-model-categories"
  });
  renderAdminCategoryList({
    list: adminTemplateCategoryList,
    status: adminTemplateCategoriesStatus,
    categories: adminTemplateCategories,
    form: adminTemplateCategoryForm,
    message: templateCategoryMessage,
    endpoint: "/api/admin/template-categories"
  });
  renderAdminCategoryList({
    list: adminStickerCategoryList,
    status: adminStickerCategoriesStatus,
    categories: adminStickerCategories,
    form: adminStickerCategoryForm,
    message: stickerCategoryMessage,
    endpoint: "/api/admin/sticker-categories"
  });
}

async function submitCategoryForm(event, endpoint, message) {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = categoryFormPayload(form);
  const editingId = form.dataset.editingId;
  message.textContent = "Сохраняю категорию...";
  try {
    await adminRequest(editingId ? `${endpoint}/${editingId}` : endpoint, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    form.reset();
    form.elements.isActive.checked = true;
    delete form.dataset.editingId;
    message.textContent = "Категория сохранена.";
    await refreshCategoriesAfterAdminMutation(endpoint);
  } catch (error) {
    message.textContent = error.message;
  }
}

async function payProfileDesigns(designs) {
  const ids = designs.map((design) => design.id);
  if (ids.length === 0) return false;
  const checkout = await openCheckoutDialog(designs);
  if (!checkout) return false;

  const result = await adminRequest("/api/profile/designs/pay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, ...checkout })
  });
  if (result.payment?.confirmationUrl) {
    window.location.href = result.payment.confirmationUrl;
    return true;
  }
  profileMeta.textContent = result.message || "Заказ создан. Оплата ожидает подтверждения.";
  selectedProfileDesignIds = new Set();
  await loadProfileDesigns();
  return true;
}

async function payProfileDesignsLegacyDisabled(designs) {
  const ids = designs.map((design) => design.id);
  if (ids.length === 0) return;
  if (!await confirmAction(`Подтвердить оплату выбранных чехлов: ${ids.length}?`)) return;

  await adminRequest("/api/profile/designs/pay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids })
  });
  profileMeta.textContent = "Заявка оплачена и передана исполнителю.";
  selectedProfileDesignIds = new Set();
  await loadProfileDesigns();
}

async function deleteProfileDesigns(ids) {
  if (ids.length === 0) return;
  if (!await confirmAction(`Удалить выбранные чехлы: ${ids.length}?`)) return;

  await adminRequest("/api/profile/designs", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids })
  });

  ids.forEach((id) => selectedProfileDesignIds.delete(id));
  if (ids.includes(activeProfileDesignId)) activeProfileDesignId = null;
  await loadProfileDesigns();
}

async function editProfileDesign(design) {
  if (!design) return;
  let fullDesign;
  try {
    fullDesign = await loadProfileDesignDetail(design);
  } catch (error) {
    profileMeta.textContent = error.message;
    return;
  }
  const state = parseJsonObject(fullDesign.designState);
  const rawLayers = Array.isArray(state.layers) ? state.layers.slice(0, 40) : [];
  let restoredImageCount = 0;
  let restoredTextCount = 0;
  const layers = rawLayers.filter((layer) => {
    if (layer?.type === "text") {
      if (restoredTextCount >= maxTextLayers) return false;
      restoredTextCount += 1;
      return true;
    }
    if (!layer?.sourceUrl || restoredImageCount >= maxImageLayers) return false;
    restoredImageCount += 1;
    return true;
  });

  selectModelById(state.modelId || fullDesign.phoneModelId);
  resetImage();
  activeTemplateId = null;
  setViewForRole("client", true);
  navigatePublicRoute("/constructor", { replace: true });

  const restoredLayers = await Promise.all(layers.map(async (layer, index) => {
    if (layer.type === "text") return textLayerFromState(layer, index);
    if (!layer.sourceUrl) return null;
    try {
      const image = await loadImagePromise(layer.sourceUrl);
      return {
        id: String(layer.id || `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`),
        type: "image",
        kind: ["photo", "sticker", "template"].includes(layer.kind) ? layer.kind : "photo",
        image,
        sourceUrl: layer.sourceUrl,
        x: Number(layer.x) || 0,
        y: Number(layer.y) || 0,
        scale: Number(layer.scale) || 1,
        rotation: Number(layer.rotation) || 0
      };
    } catch {
      templateAdminMessage.textContent = "Не удалось загрузить одну из картинок сохраненного чехла.";
      return null;
    }
  }));
  userLayers = restoredLayers.filter(Boolean);
  selectedLayerId = userLayers.at(-1)?.id || null;
  userImage = [...userLayers].reverse().find((layer) => !isTextLayer(layer))?.image || null;
  syncControlsFromSelectedLayer();
  renderTemplates();
  render();
}

async function saveProfilePassword() {
  profilePasswordMessage.textContent = "Сохраняю пароль...";
  saveProfilePasswordButton.disabled = true;
  try {
    const result = await adminRequest("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: profileNewPassword.value
      })
    });
    profileNewPassword.value = "";
    profilePasswordMessage.textContent = result.message || "Пароль обновлен.";
  } catch (error) {
    profilePasswordMessage.textContent = error.message;
  } finally {
    saveProfilePasswordButton.disabled = false;
  }
}

function roleLabel(role) {
  if (role === "admin") return "администратор";
  if (role === "executor") return "исполнитель";
  return "клиент";
}

function updateProfileVisibilityButton() {
  if (!profileVisibilityButton || !currentUser) return;
  const isPublic = Boolean(currentUser.profilePublic);
  profileVisibilityButton.classList.toggle("is-private", !isPublic);
  profileVisibilityButton.setAttribute("aria-pressed", String(isPublic));
  profileVisibilityButton.setAttribute("aria-label", isPublic ? "Скрыть профиль" : "Открыть профиль");
  profileVisibilityButton.title = isPublic ? "Профиль открыт. Нажмите, чтобы скрыть." : "Профиль скрыт. Нажмите, чтобы открыть.";
}

async function toggleProfileVisibility() {
  if (!currentUser) return;
  const nextValue = !currentUser.profilePublic;
  profileVisibilityButton.disabled = true;
  try {
    const result = await adminRequest("/api/profile/visibility", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profilePublic: nextValue })
    });
    currentUser = result.user;
    storeSession(localStorage.getItem(tokenKey), currentUser);
    updateAuthUi();
    updateProfileVisibilityButton();
  } catch (error) {
    profileMeta.textContent = error.message;
  } finally {
    profileVisibilityButton.disabled = false;
  }
}

async function openPublicProfile(userId) {
  if (!userId || !publicProfileDialog) return;
  publicProfileName.textContent = "Загрузка...";
  publicProfileMeta.textContent = "";
  setAvatarPreview(publicProfileAvatar, null, "?");
  publicProfileDesigns.innerHTML = "";
  if (typeof publicProfileDialog.showModal === "function") publicProfileDialog.showModal();
  else publicProfileDialog.setAttribute("open", "");

  try {
    const response = await fetch(apiUrl(`/api/users/${userId}/profile`), { headers: authHeaders(), cache: "no-cache" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Не удалось открыть профиль.");

    const profile = data.user;
    publicProfileName.textContent = profile.name;
    publicProfileMeta.textContent = `${roleLabel(profile.role)} · ${profile.emailPreview}`;
    setAvatarPreview(publicProfileAvatar, profile.avatarUrl, profile.name?.slice(0, 1) || "?");
    publicProfileDesigns.innerHTML = "";

    if (!profile.profilePublic) {
      const hidden = document.createElement("p");
      hidden.className = "admin-empty";
      hidden.textContent = "Профиль скрыт. Видны только имя и первые буквы почты.";
      publicProfileDesigns.append(hidden);
      return;
    }

    if (!data.designs.length) {
      const empty = document.createElement("p");
      empty.className = "admin-empty";
      empty.textContent = "В профиле пока нет сохраненных работ.";
      publicProfileDesigns.append(empty);
      return;
    }

    data.designs.forEach((design) => {
      const card = document.createElement("article");
      card.className = "profile-design-card public-profile-design-card";
      card.innerHTML = `
        <img src="${displayImageUrl(design.previewWithCameraUrl)}" alt="" loading="lazy" decoding="async">
        <strong>${escapeHtml(design.title)}</strong>
        <span>${escapeHtml(design.modelName || "Модель не выбрана")}</span>
        <span>${designStatusLabel(design)}</span>
      `;
      publicProfileDesigns.append(card);
    });
  } catch (error) {
    publicProfileName.textContent = "Ошибка";
    publicProfileMeta.textContent = error.message;
  }
}

async function openProfile() {
  if (!currentUser) {
    openAuth("register");
    return;
  }
  profileName.textContent = currentUser.name;
  profileMeta.textContent = `Email: ${currentUser.email}. Роль: ${roleLabel(currentUser.role)}.`;
  setAvatarPreview(profileAvatarPreview, currentUser.avatarUrl, currentUser.name?.slice(0, 1) || "?");
  profileAvatarList?.classList.add("hidden");
  selectedProfileDesignIds = new Set();
  activeProfileDesignId = null;
  profileOrdersPanel?.classList.add("hidden");
  profileOrdersToggleButton?.classList.remove("is-active");
  if (profileOrdersToggleButton) profileOrdersToggleButton.textContent = "Мои заказы";
  profilePasswordPanel?.classList.add("hidden");
  profileExecutorPanel?.classList.toggle("hidden", currentUser.role !== "executor");
  updateProfileVisibilityButton();
  if (profilePasswordMessage) profilePasswordMessage.textContent = "";
  if (typeof profileDialog.showModal === "function") profileDialog.showModal();
  else profileDialog.setAttribute("open", "");
  await Promise.allSettled([
    loadAvatarOptions(),
    loadProfileDesigns(),
    currentUser.role === "executor" ? loadExecutorOrders() : Promise.resolve()
  ]);
}

function productionStatusText(status) {
  if (status === "delivered") return "Доставлено";
  if (status === "shipped") return "Отправлен";
  if (status === "ready") return "Готов к отправке";
  if (status === "in_work") return "В работе";
  return "Новая заявка";
}

async function loadExecutorOrders() {
  if (!currentUser || !["executor", "admin"].includes(currentUser.role) || !executorOrderList) return;
  executorOrdersStatus.textContent = "Загрузка...";
  try {
    executorOrders = await adminRequest("/api/executor/orders");
    renderExecutorOrders();
    renderProfileExecutorOrders();
  } catch (error) {
    executorOrdersStatus.textContent = "Ошибка";
    executorMessage.textContent = error.message;
    if (profileExecutorStatus) profileExecutorStatus.textContent = "Ошибка";
  }
}

function renderExecutorOrders() {
  executorOrderList.innerHTML = "";
  const visibleOrders = executorOrders.filter((order) => !["shipped", "delivered"].includes(order.productionStatus));
  executorOrdersStatus.textContent = `${visibleOrders.length}`;
  if (visibleOrders.length === 0) {
    const empty = document.createElement("p");
    empty.className = "admin-empty";
    empty.textContent = "Заявок в работе пока нет.";
    executorOrderList.append(empty);
    return;
  }

  visibleOrders.forEach((order) => {
    const item = document.createElement("article");
    item.className = "executor-order-card";
    item.innerHTML = `
      <div class="executor-order-images">
        ${orderPreviewMarkup(order.previewWithCameraUrl)}
        ${order.executorPhotoUrl ? orderPreviewMarkup(order.executorPhotoUrl) : `<div class="executor-photo-placeholder">Фото готового чехла не прикреплено</div>`}
      </div>
      <div class="executor-order-body">
        <strong>${escapeHtml(orderDisplayTitle(order))}</strong>
        <span>${escapeHtml(order.modelName || "Модель не выбрана")} · ${productionStatusText(order.productionStatus)}</span>
        <span>Клиент: <button class="link-button profile-link-button" type="button" data-profile-id="${order.customerId}">${escapeHtml(order.customerName)}</button> · ${escapeHtml(order.customerEmail)}</span>
      </div>
    `;
    item.querySelector("[data-profile-id]")?.addEventListener("click", () => openPublicProfile(order.customerId));

    const actions = document.createElement("div");
    actions.className = "admin-list-actions";
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    const uploadButton = createAdminButton("Прикрепить фото", "primary mini-button", async () => {
      if (!fileInput.files[0]) {
        executorMessage.textContent = "Сначала выберите фото готового чехла.";
        return;
      }
      const formData = new FormData();
      formData.set("finalPhoto", fileInput.files[0]);
      executorMessage.textContent = "Загружаю фото...";
      try {
        await adminRequest(`/api/executor/orders/${order.id}/photo`, { method: "POST", body: formData });
        executorMessage.textContent = "Фото прикреплено.";
        await loadExecutorOrders();
      } catch (error) {
        executorMessage.textContent = error.message;
      }
    });
    const shipButton = createAdminButton("Статус: отправлен", order.executorPhotoUrl ? "ghost mini-button" : "ghost mini-button is-disabled", async () => {
      executorMessage.textContent = "Обновляю статус...";
      try {
        await adminRequest(`/api/executor/orders/${order.id}/ship`, { method: "POST" });
        executorMessage.textContent = "Заявка отмечена как отправленная.";
        await loadExecutorOrders();
      } catch (error) {
        executorMessage.textContent = error.message;
      }
    });
    shipButton.disabled = !order.executorPhotoUrl;
    actions.append(fileInput, uploadButton, shipButton);
    item.append(actions);
    executorOrderList.append(item);
  });
}

function renderProfileExecutorOrders() {
  if (!profileExecutorPanel || !profileExecutorList || !currentUser) return;
  const isExecutorProfile = currentUser.role === "executor";
  profileExecutorPanel.classList.toggle("hidden", !isExecutorProfile);
  if (!isExecutorProfile) return;

  const visibleOrders = executorOrders.filter((order) => {
    return executorShowShipped ? ["shipped", "delivered"].includes(order.productionStatus) : !["shipped", "delivered"].includes(order.productionStatus);
  });
  if (profileExecutorTitle) {
    profileExecutorTitle.textContent = executorShowShipped ? "Отправленные заказы" : "Заявки в работе";
  }
  if (profileExecutorStatus) profileExecutorStatus.textContent = `${visibleOrders.length}`;
  if (profileExecutorShippedToggle) {
    profileExecutorShippedToggle.classList.toggle("is-active", executorShowShipped);
    profileExecutorShippedToggle.textContent = executorShowShipped ? "Показать заявки в работе" : "Отправленные заказы";
  }

  profileExecutorList.innerHTML = "";
  if (visibleOrders.length === 0) {
    const empty = document.createElement("p");
    empty.className = "admin-empty";
    empty.textContent = executorShowShipped ? "Отправленных заказов пока нет." : "Заявок в работе пока нет.";
    profileExecutorList.append(empty);
    return;
  }

  visibleOrders.forEach((order) => {
    const item = document.createElement("article");
    item.className = "profile-executor-order";
    item.innerHTML = `
      ${orderPreviewMarkup(order.executorPhotoUrl || order.previewWithCameraUrl)}
      <div>
        <strong>${escapeHtml(orderDisplayTitle(order))}</strong>
        <span>${escapeHtml(order.modelName || "Модель не выбрана")} · ${productionStatusText(order.productionStatus)}</span>
        <span>Клиент: <button class="link-button profile-link-button" type="button" data-profile-id="${order.customerId}">${escapeHtml(order.customerName)}</button></span>
      </div>
    `;
    item.querySelector("[data-profile-id]")?.addEventListener("click", () => openPublicProfile(order.customerId));
    profileExecutorList.append(item);
  });
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function designTransformSnapshot() {
  return {
    selectedLayerId,
    activeTemplateId,
    layers: userLayers.map((layer) => ({ ...layer }))
  };
}

function snapshotsEqual(left, right) {
  const comparable = (snapshot) => ({
    selectedLayerId: snapshot?.selectedLayerId || null,
    activeTemplateId: snapshot?.activeTemplateId ?? null,
    layers: (snapshot?.layers || []).map(({ id, x, y, scale, rotation }) => ({ id, x, y, scale, rotation }))
  });
  return JSON.stringify(comparable(left)) === JSON.stringify(comparable(right));
}

function restoreDesignTransformSnapshot(snapshot) {
  if (!snapshot) return;
  userLayers = snapshot.layers.map((layer) => ({ ...layer }));
  selectedLayerId = userLayers.some((layer) => layer.id === snapshot.selectedLayerId) ? snapshot.selectedLayerId : null;
  activeTemplateId = snapshot.activeTemplateId ?? null;
  userImage = [...userLayers].reverse().find((layer) => !isTextLayer(layer))?.image || null;
  syncControlsFromSelectedLayer();
  renderTemplates();
  render();
}

async function saveTextLayer(options = {}) {
  const value = String(options.text || "").trim();
  if (!value) throw new Error("Введите текст.");
  await document.fonts?.ready;
  const before = designTransformSnapshot();
  const existing = options.createNew ? null : selectedLayer();
  if (!isTextLayer(existing) && !canAddTextLayers(1, { messageTarget: null })) {
    throw new Error(`Можно добавить не больше ${maxTextLayers} надписей.`);
  }
  const layer = isTextLayer(existing) ? existing : {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: "text",
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0
  };
  Object.assign(layer, {
    type: "text",
    text: value,
    color: options.color || "#17201b",
    fontFamily: textFontFamilies[options.fontFamily] ? options.fontFamily : "manrope",
    fontSize: Math.min(180, Math.max(36, Number(options.fontSize) || 72)),
    fontWeight: options.fontWeight === "700" ? "700" : "400",
    textAlign: ["left", "center", "right"].includes(options.textAlign) ? options.textAlign : "center",
    opacity: Math.min(1, Math.max(0.1, Number(options.opacity) || 1)),
    strokeEnabled: Boolean(options.strokeEnabled),
    strokeColor: options.strokeColor || "#ffffff",
    strokeWidth: Math.min(12, Math.max(0, Number(options.strokeWidth) || 0)),
    shadowEnabled: Boolean(options.shadowEnabled),
    shadowColor: options.shadowColor || "#000000",
    shadowBlur: Math.min(30, Math.max(0, Number(options.shadowBlur) || 8))
  });
  const measured = textLayerMetrics(ctx, layer);
  layer.width = measured.width;
  layer.height = measured.height;
  if (!isTextLayer(existing)) userLayers.push(layer);
  selectedLayerId = layer.id;
  activeTemplateId = null;
  syncControlsFromSelectedLayer();
  commitDesignHistory(before);
  renderTemplates();
  render();
  return layer;
}

function updateSelectedTextLayer(options = {}) {
  const layer = selectedLayer();
  if (!isTextLayer(layer)) throw new Error("Выберите надпись на чехле.");
  const value = String(options.text || "").slice(0, 160);
  Object.assign(layer, {
    text: value,
    color: options.color || "#17201b",
    fontFamily: textFontFamilies[options.fontFamily] ? options.fontFamily : "manrope",
    fontSize: Math.min(180, Math.max(36, Number(options.fontSize) || 72)),
    fontWeight: options.fontWeight === "700" ? "700" : "400",
    textAlign: ["left", "center", "right"].includes(options.textAlign) ? options.textAlign : "center",
    opacity: Math.min(1, Math.max(0.1, Number(options.opacity) || 1)),
    strokeEnabled: Boolean(options.strokeEnabled),
    strokeColor: options.strokeColor || "#ffffff",
    strokeWidth: Math.min(12, Math.max(0, Number(options.strokeWidth) || 0)),
    shadowEnabled: Boolean(options.shadowEnabled),
    shadowColor: options.shadowColor || "#000000",
    shadowBlur: Math.min(30, Math.max(0, Number(options.shadowBlur) || 8))
  });
  const measured = textLayerMetrics(ctx, layer);
  layer.width = measured.width;
  layer.height = measured.height;
  syncControlsFromSelectedLayer();
  render();
  return layer;
}

function textLayerFromState(state, index = 0, offset = null) {
  const layer = {
    id: String(state.id || `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`),
    type: "text",
    text: String(state.text || "Текст"),
    x: offset ? offset.x : Number(state.x) || 0,
    y: offset ? offset.y : Number(state.y) || 0,
    scale: Number(state.scale) || 1,
    rotation: Number(state.rotation) || 0,
    width: Number(state.width) || 0,
    height: Number(state.height) || 0,
    color: state.color || "#17201b",
    fontFamily: textFontFamilies[state.fontFamily] ? state.fontFamily : "manrope",
    fontSize: Math.min(180, Math.max(36, Number(state.fontSize) || 72)),
    fontWeight: state.fontWeight === "700" ? "700" : "400",
    textAlign: ["left", "center", "right"].includes(state.textAlign) ? state.textAlign : "center",
    opacity: Math.min(1, Math.max(0.1, Number(state.opacity) || 1)),
    strokeEnabled: Boolean(state.strokeEnabled),
    strokeColor: state.strokeColor || "#ffffff",
    strokeWidth: Math.min(12, Math.max(0, Number(state.strokeWidth) || 0)),
    shadowEnabled: Boolean(state.shadowEnabled),
    shadowColor: state.shadowColor || "#000000",
    shadowBlur: Math.min(30, Math.max(0, Number(state.shadowBlur) || 8))
  };
  const measured = textLayerMetrics(ctx, layer);
  layer.width = measured.width;
  layer.height = measured.height;
  return layer;
}

function commitDesignHistory(before) {
  const after = designTransformSnapshot();
  if (!before || snapshotsEqual(before, after)) return;
  designUndoStack.push(before);
  if (designUndoStack.length > 60) designUndoStack.shift();
  designRedoStack.length = 0;
}

function undoDesignAction() {
  const previous = designUndoStack.pop();
  if (!previous) return;
  designRedoStack.push(designTransformSnapshot());
  restoreDesignTransformSnapshot(previous);
}

function redoDesignAction() {
  const next = designRedoStack.pop();
  if (!next) return;
  designUndoStack.push(designTransformSnapshot());
  restoreDesignTransformSnapshot(next);
}

function removeSelectedLayer() {
  const index = userLayers.findIndex((layer) => layer.id === selectedLayerId);
  if (index < 0) return;
  const before = designTransformSnapshot();
  const nextSelectedLayerId = userLayers[index + 1]?.id || userLayers[index - 1]?.id || null;
  setSelectedDesignLayer(nextSelectedLayerId);
  userLayers.splice(index, 1);
  userImage = [...userLayers].reverse().find((layer) => !isTextLayer(layer))?.image || null;
  syncControlsFromSelectedLayer();
  commitDesignHistory(before);
  renderTemplates();
  render();
}

function scheduleCanvasRender() {
  if (renderFrame) return;
  renderFrame = requestAnimationFrame(() => {
    renderFrame = 0;
    render();
  });
}

function pointerPair() {
  return [...canvasPointers.values()].slice(0, 2);
}

function pairMetrics(points) {
  const [a, b] = points;
  return {
    centerX: (a.x + b.x) / 2,
    centerY: (a.y + b.y) / 2,
    distance: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)),
    angle: Math.atan2(b.y - a.y, b.x - a.x)
  };
}

function isInsideCase(point) {
  const rect = caseRect();
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

function findLayerAtPoint(point) {
  const rect = caseRect();
  const renderOrder = orderedLayersForRendering();
  for (let index = renderOrder.length - 1; index >= 0; index -= 1) {
    const layer = renderOrder[index];
    const { drawW, drawH } = layerDisplaySize(ctx, layer, rect);
    const centerX = rect.x + rect.w / 2 + layer.x;
    const centerY = rect.y + rect.h / 2 + layer.y;
    const dx = point.x - centerX;
    const dy = point.y - centerY;
    const cos = Math.cos(-layer.rotation);
    const sin = Math.sin(-layer.rotation);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    if (Math.abs(localX) <= drawW / 2 && Math.abs(localY) <= drawH / 2) return layer;
  }
  return null;
}

function startDrag(event) {
  const point = canvasPoint(event);
  try {
    canvas.setPointerCapture?.(event.pointerId);
  } catch {
    // Synthetic events used by layout tests are not active hardware pointers.
  }
  canvasPointers.set(event.pointerId, point);
  if (canvasPointers.size >= 2 && selectedLayer()) {
    const layer = selectedLayer();
    if (!gestureHistoryStart) gestureHistoryStart = designTransformSnapshot();
    const metrics = pairMetrics(pointerPair());
    canvasGesture = {
      ...metrics,
      layerId: layer.id,
      imageX: layer.x,
      imageY: layer.y,
      scale: layer.scale,
      rotation: layer.rotation
    };
    drag.active = false;
    event.preventDefault();
    return;
  }
  if (userLayers.length === 0 || !isInsideCase(point)) {
    setSelectedDesignLayer(null);
    drag.active = false;
    render();
    return;
  }
  const layer = findLayerAtPoint(point);
  if (!layer) {
    setSelectedDesignLayer(null);
    drag.active = false;
    render();
    return;
  }
  if (!gestureHistoryStart) gestureHistoryStart = designTransformSnapshot();
  setSelectedDesignLayer(layer.id);
  syncControlsFromSelectedLayer();
  drag = { active: true, moved: false, startX: point.x, startY: point.y, imageX: layer.x, imageY: layer.y, layerId: layer.id };
  if (canvasPointers.size >= 2) {
    const metrics = pairMetrics(pointerPair());
    canvasGesture = {
      ...metrics,
      layerId: layer.id,
      imageX: layer.x,
      imageY: layer.y,
      scale: layer.scale,
      rotation: layer.rotation
    };
    drag.active = false;
  }
  event.preventDefault();
  render();
}

function moveDrag(event) {
  const point = canvasPoint(event);
  if (!canvasPointers.has(event.pointerId)) return;
  canvasPointers.set(event.pointerId, point);
  if (canvasPointers.size >= 2) {
    const layer = selectedLayer();
    if (!layer) return;
    if (!canvasGesture) {
      const metrics = pairMetrics(pointerPair());
      canvasGesture = { ...metrics, layerId: layer.id, imageX: layer.x, imageY: layer.y, scale: layer.scale, rotation: layer.rotation };
    }
    const metrics = pairMetrics(pointerPair());
    layer.scale = Math.min(4, Math.max(0.25, canvasGesture.scale * metrics.distance / canvasGesture.distance));
    layer.rotation = canvasGesture.rotation + metrics.angle - canvasGesture.angle;
    layer.x = canvasGesture.imageX + metrics.centerX - canvasGesture.centerX;
    layer.y = canvasGesture.imageY + metrics.centerY - canvasGesture.centerY;
    syncControlsFromSelectedLayer();
    event.preventDefault();
    scheduleCanvasRender();
    return;
  }
  if (!drag.active) return;
  event.preventDefault();
  const layer = userLayers.find((item) => item.id === drag.layerId);
  if (!layer) return;
  if (Math.hypot(point.x - drag.startX, point.y - drag.startY) > 6) drag.moved = true;
  layer.x = drag.imageX + point.x - drag.startX;
  layer.y = drag.imageY + point.y - drag.startY;
  scheduleCanvasRender();
}

function endDrag(event) {
  const openedLayer = canvasPointers.size === 1 && drag.active && !drag.moved ? selectedLayer() : null;
  canvasPointers.delete(event.pointerId);
  if (canvasPointers.size === 1 && selectedLayer()) {
    const [point] = canvasPointers.values();
    const layer = selectedLayer();
    drag = { active: true, moved: true, startX: point.x, startY: point.y, imageX: layer.x, imageY: layer.y, layerId: layer.id };
    canvasGesture = null;
  } else if (canvasPointers.size === 0) {
    drag.active = false;
    canvasGesture = null;
    commitDesignHistory(gestureHistoryStart);
    gestureHistoryStart = null;
  }
  openEditorForLayer(openedLayer);
}

modelSelect.addEventListener("change", () => {
  render();
  updateModelPickerButton();
});
let transformInputHistoryStart = null;
[scaleInput, rotateInput].forEach((input) => {
  input.addEventListener("pointerdown", () => {
    transformInputHistoryStart = designTransformSnapshot();
  });
  input.addEventListener("input", render);
  input.addEventListener("change", () => {
    commitDesignHistory(transformInputHistoryStart);
    transformInputHistoryStart = null;
  });
});
resetButton.addEventListener("click", () => {
  const before = designTransformSnapshot();
  activeTemplateId = null;
  resetImage();
  renderTemplates();
  commitDesignHistory(before);
});

function moveSelectedLayerWithinType(direction) {
  const layer = selectedLayer();
  if (!layer) return;
  const peerIndices = userLayers
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => isTextLayer(item) === isTextLayer(layer))
    .map(({ index }) => index);
  const peerPosition = peerIndices.indexOf(userLayers.indexOf(layer));
  const targetPosition = peerPosition + direction;
  if (peerPosition < 0 || targetPosition < 0 || targetPosition >= peerIndices.length) return;
  const before = designTransformSnapshot();
  const targetIndex = peerIndices[targetPosition];
  const currentIndex = peerIndices[peerPosition];
  [userLayers[currentIndex], userLayers[targetIndex]] = [userLayers[targetIndex], userLayers[currentIndex]];
  syncControlsFromSelectedLayer();
  commitDesignHistory(before);
  render();
}

sendBackwardButton?.addEventListener("click", () => moveSelectedLayerWithinType(-1));
bringForwardButton?.addEventListener("click", () => moveSelectedLayerWithinType(1));
deleteSelectedImageButton?.addEventListener("click", () => {
  removeSelectedLayer();
  window.dispatchEvent(new CustomEvent("case-editor:close-tool-editor", { detail: { reason: "image-deleted" } }));
});

window.caseEditorHistory = {
  undo: undoDesignAction,
  redo: redoDesignAction,
  removeSelected: removeSelectedLayer
};
window.caseEditorTools = {
  saveText: saveTextLayer,
  updateSelectedText: updateSelectedTextLayer,
  designState: () => designStatePayload(),
  printDataUrl: () => printDesignDataUrl(),
  selectedText: () => {
    const layer = selectedLayer();
    return isTextLayer(layer) ? { ...layer } : null;
  },
  selectedImage: () => {
    const layer = selectedLayer();
    return layer && !isTextLayer(layer) ? { ...layer, kind: imageLayerKind(layer), image: undefined } : null;
  }
};

saveProfileButton?.addEventListener("click", saveDesignToProfile);
openProfileButton?.addEventListener("click", () => navigatePublicRoute("/profile"));
closeProfileButton?.addEventListener("click", () => profileDialog.close());
profileDialog?.addEventListener("close", syncRouteAfterProfileClose);
profileLogoutButton?.addEventListener("click", () => {
  clearPrivateClientState();
  clearStoredSession();
  resetSupportChatIdentity();
  currentUser = null;
  updateAuthUi();
  profileDialog.close();
});
openPasswordPanelButton?.addEventListener("click", () => {
  profilePasswordPanel?.classList.toggle("hidden");
  if (profilePasswordMessage) profilePasswordMessage.textContent = "";
});
profileVisibilityButton?.addEventListener("click", toggleProfileVisibility);
profileOrdersToggleButton?.addEventListener("click", () => toggleProfileOrders());
profileOrderFilters?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-profile-order-filter]");
  if (!button) return;
  profileOrderFilter = button.dataset.profileOrderFilter || "all";
  renderProfileOrders();
});
profileAvatarPreview?.addEventListener("click", toggleProfileAvatarList);
saveProfilePasswordButton?.addEventListener("click", saveProfilePassword);
closePublicProfileButton?.addEventListener("click", () => publicProfileDialog.close());
paySelectedDesignsButton?.addEventListener("click", () => payProfileDesigns(selectedProfileDesigns()));
deleteSelectedDesignsButton?.addEventListener("click", () => deleteProfileDesigns([...selectedProfileDesignIds]));
paySingleDesignButton?.addEventListener("click", () => payProfileDesigns(selectedProfileDesigns().slice(0, 1)));
deleteSingleDesignButton?.addEventListener("click", () => deleteProfileDesigns(selectedProfileDesigns().slice(0, 1).map((design) => design.id)));
editSingleDesignButton?.addEventListener("click", () => editProfileDesign(selectedProfileDesigns()[0]));
executorRefreshButton?.addEventListener("click", loadExecutorOrders);
profileExecutorShippedToggle?.addEventListener("click", () => {
  executorShowShipped = !executorShowShipped;
  renderProfileExecutorOrders();
});
profileDesignList?.addEventListener("wheel", (event) => {
  const canScrollHorizontally = profileDesignList.scrollWidth > profileDesignList.clientWidth;
  if (!canScrollHorizontally) return;

  event.preventDefault();
  const wheelDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  profileDesignList.scrollLeft += wheelDelta;
}, { passive: false });
window.addEventListener("pointermove", handleProfileRangeMove);
window.addEventListener("pointerup", () => {
  profileSelectionDrag.active = false;
});
window.addEventListener("pointercancel", () => {
  profileSelectionDrag.active = false;
});

imageInput.addEventListener("change", async (event) => {
  const availableSlots = Math.max(0, maxImageLayers - imageLayerCount());
  const files = Array.from(event.target.files || [])
    .filter((file) => file?.type?.startsWith("image/"))
    .slice(0, availableSlots);

  if (files.length === 0) {
    imageInput.value = "";
    return;
  }

  try {
    for (const [index, file] of files.entries()) {
      const { image, sourceUrl } = await prepareUserImageFile(file);
      addUserImageLayer(image, null, sourceUrl, { openEditor: index === files.length - 1 });
    }
  } catch (error) {
    templateAdminMessage.textContent = error.message || "Не удалось загрузить изображение.";
  } finally {
    imageInput.value = "";
  }
});

adminTemplateAddTextButton?.addEventListener("click", () => {
  if (!clientWorkspace?.classList.contains("template-builder-workspace")) {
    adminTemplateTextMessage.textContent = "Откройте раздел «Макеты», чтобы добавить текст.";
    return;
  }
  adminTemplateTextMessage.textContent = "Введите текст в панели справа.";
  window.dispatchEvent(new CustomEvent("case-editor:open-text-editor", { detail: { forceNewText: true } }));
});

adminEditorSelect?.addEventListener("change", () => {
  showAdminEditor(adminEditorSelect.value);
});
adminEditorNavButtons.forEach((button) => button.addEventListener("click", () => {
  showAdminEditor(button.dataset.adminTarget);
}));
openSupportChatButton?.addEventListener("click", openSupportChat);
closeSupportChatButton?.addEventListener("click", closeSupportChat);
supportChatDialog?.addEventListener("close", () => {
  stopSupportPolling();
  cornerCatWidget?.classList.remove("is-chat-open");
});
supportChatForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  sendCustomerSupportMessage();
});
adminSupportRefreshButton?.addEventListener("click", () => loadAdminSupportConversations({ selectFirst: true }));
adminSupportForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  sendAdminSupportMessage();
});
analyticsPeriodSelect?.addEventListener("change", loadAdminAnalytics);
adminAvatarForm?.addEventListener("submit", submitAdminAvatar);
adminAvatarFile?.addEventListener("change", () => loadAvatarEditorFile(adminAvatarFile.files?.[0]));
adminAvatarScale?.addEventListener("input", () => {
  avatarEditorState.scale = Math.max(0.5, Number(adminAvatarScale.value || 100) / 100);
  renderAvatarEditor();
});
adminAvatarResetButton?.addEventListener("click", () => resetAvatarEditor({ keepImage: true }));
adminAvatarCanvas?.addEventListener("pointerdown", (event) => {
  if (!avatarEditorState.image) return;
  avatarEditorState.dragging = true;
  const point = avatarCanvasPoint(event);
  avatarEditorState.lastX = point.x;
  avatarEditorState.lastY = point.y;
  adminAvatarCanvas.setPointerCapture?.(event.pointerId);
});
adminAvatarCanvas?.addEventListener("pointermove", (event) => {
  if (!avatarEditorState.dragging) return;
  const point = avatarCanvasPoint(event);
  avatarEditorState.x += point.x - avatarEditorState.lastX;
  avatarEditorState.y += point.y - avatarEditorState.lastY;
  avatarEditorState.lastX = point.x;
  avatarEditorState.lastY = point.y;
  renderAvatarEditor();
});
adminAvatarCanvas?.addEventListener("pointerup", () => {
  avatarEditorState.dragging = false;
});
adminAvatarCanvas?.addEventListener("pointercancel", () => {
  avatarEditorState.dragging = false;
});
renderAvatarEditor();
adminOrderUserSelect?.addEventListener("change", loadAdminOrders);
adminOrderModelSelect?.addEventListener("change", loadAdminOrders);
adminOrderDateSort?.addEventListener("change", loadAdminOrders);

maskZoomInput?.addEventListener("input", () => {
  updateMaskCanvasDisplay();
  updateRangeOutputs();
});
cameraMaskCanvas?.parentElement?.addEventListener("wheel", (event) => {
  if (!event.ctrlKey) return;
  event.preventDefault();
  changeMaskZoom(event.deltaY < 0 ? 10 : -10);
}, { passive: false });
eraserSizeInput?.addEventListener("input", updateRangeOutputs);
eraserHardnessInput?.addEventListener("input", updateRangeOutputs);

phoneImageInput?.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    modelAdminMessage.textContent = "Фото телефона должно быть изображением.";
    phoneImageInput.value = "";
    return;
  }
  adminPhoneImage = await loadLocalImage(file);
  setModelSizeFromImage(adminPhoneImage);
  usePhoneImageForCamera = true;
  openCameraMaskEditor(adminPhoneImage);
  modelAdminMessage.textContent = `Фото добавлено в оба редактора: ${adminPhoneImage.width}×${adminPhoneImage.height}. Теперь можно стереть лишнее вокруг камер.`;
  renderAdminModelPreview();
});

cameraImageInput?.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    modelAdminMessage.textContent = "Фото камер должно быть изображением.";
    cameraImageInput.value = "";
    return;
  }
  const image = await loadLocalImage(file);
  usePhoneImageForCamera = false;
  openCameraMaskEditor(image);
  modelAdminMessage.textContent = `Фото блока камер добавлено: ${image.width}×${image.height}. Сотрите лишнее вокруг камер.`;
});

usePhoneAsCameraButton?.addEventListener("click", () => {
  if (!adminPhoneImage) {
    modelAdminMessage.textContent = "Сначала загрузите фото телефона.";
    return;
  }
  usePhoneImageForCamera = true;
  openCameraMaskEditor(adminPhoneImage);
  modelAdminMessage.textContent = "Фото телефона используется только как основа для подготовки маски камер.";
});

adminPreviewTestImageInput?.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    adminPreviewTestImage = await loadLocalImage(file);
    renderAdminModelPreview();
  } catch {
    modelAdminMessage.textContent = "Не удалось открыть тестовую картинку.";
  }
});

[adminPreviewShowTestImage, adminPreviewShowCamera, cameraOffsetXInput, cameraOffsetYInput, cameraScaleInput].forEach((input) => {
  input?.addEventListener("input", () => {
    updateRangeOutputs();
    renderAdminModelPreview();
  });
});

function setCameraLayoutInput(input, value) {
  if (!input) return;
  const min = Number(input.min || -Infinity);
  const max = Number(input.max || Infinity);
  input.value = String(clamp(Math.round(value), min, max));
}

function adminPreviewModelPoint(event) {
  const model = readAdminModelForm();
  const bounds = adminModelPreview.getBoundingClientRect();
  const pointX = (event.clientX - bounds.left) * (adminModelPreview.width / bounds.width);
  const pointY = (event.clientY - bounds.top) * (adminModelPreview.height / bounds.height);
  const scale = Math.min((adminModelPreview.width - 72) / model.w, (adminModelPreview.height - 54) / model.h);
  return { x: (pointX - (adminModelPreview.width - model.w * scale) / 2) / scale, y: (pointY - (adminModelPreview.height - model.h * scale) / 2) / scale };
}

adminModelPreview?.addEventListener("pointerdown", (event) => {
  if (!cameraMaskImage && !editingModelId) return;
  const point = adminPreviewModelPoint(event);
  adminCameraPreviewDrag = {
    pointerId: event.pointerId,
    point,
    offsetX: Number(cameraOffsetXInput?.value || 0),
    offsetY: Number(cameraOffsetYInput?.value || 0)
  };
  try { adminModelPreview.setPointerCapture(event.pointerId); } catch {}
  event.preventDefault();
});

adminModelPreview?.addEventListener("pointermove", (event) => {
  if (!adminCameraPreviewDrag || adminCameraPreviewDrag.pointerId !== event.pointerId) return;
  const point = adminPreviewModelPoint(event);
  setCameraLayoutInput(cameraOffsetXInput, adminCameraPreviewDrag.offsetX + point.x - adminCameraPreviewDrag.point.x);
  setCameraLayoutInput(cameraOffsetYInput, adminCameraPreviewDrag.offsetY + point.y - adminCameraPreviewDrag.point.y);
  updateRangeOutputs();
  renderAdminModelPreview();
  event.preventDefault();
});

["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => adminModelPreview?.addEventListener(type, () => {
  adminCameraPreviewDrag = null;
}));

const maskPointerCanvas = cameraToolOverlayCanvas || cameraMaskCanvas;
maskPointerCanvas?.addEventListener("mousedown", startEraser);
maskPointerCanvas?.addEventListener("mousemove", moveEraser);
window.addEventListener("mouseup", stopEraser);
maskPointerCanvas?.addEventListener("touchstart", startEraser, { passive: false });
maskPointerCanvas?.addEventListener("touchmove", moveEraser, { passive: false });
window.addEventListener("touchend", stopEraser);
undoEraserButton?.addEventListener("click", undoEraser);
redoEraserButton?.addEventListener("click", redoEraser);
resetEraserButton?.addEventListener("click", resetCameraMaskToOriginal);
maskToolMode?.addEventListener("change", () => {
  maskToolModeValue = maskToolMode.value;
  syncMaskToolButtons();
  if (cameraToolOverlayCanvas) cameraToolOverlayCanvas.style.cursor = maskToolModeValue === "eraser" ? "crosshair" : "move";
  redrawToolOverlay();
});
protectedFrameToggle?.addEventListener("change", () => {
  protectedFrame.enabled = protectedFrameToggle.checked;
  if (protectedFrame.enabled && maskToolMode) {
    maskToolMode.value = "frame";
    maskToolModeValue = "frame";
  }
  cameraMaskDirty = true;
  updateCameraMaskPreview();
});
frameThicknessInput?.addEventListener("input", () => {
  protectedFrame.thickness = Number(frameThicknessInput.value || 4);
  updateRangeOutputs();
  cameraMaskDirty = true;
  updateCameraMaskPreview();
});
frameRadiusInput?.addEventListener("input", () => {
  protectedFrame.radius = Number(frameRadiusInput.value || 0);
  updateRangeOutputs();
  cameraMaskDirty = true;
  updateCameraMaskPreview();
});
frameColorInput?.addEventListener("input", () => {
  protectedFrame.color = frameColorInput.value || "#111816";
  cameraMaskDirty = true;
  updateCameraMaskPreview();
});
fitFrameButton?.addEventListener("click", () => {
  protectedFrame.enabled = true;
  if (protectedFrameToggle) protectedFrameToggle.checked = true;
  if (maskToolMode) {
    maskToolMode.value = "frame";
    maskToolModeValue = "frame";
  }
  protectedFrame.x = Math.round(cameraMaskCanvas.width * 0.08);
  protectedFrame.y = Math.round(cameraMaskCanvas.height * 0.08);
  protectedFrame.w = Math.round(cameraMaskCanvas.width * 0.5);
  protectedFrame.h = Math.round(cameraMaskCanvas.height * 0.35);
  protectedFrame.radius = Number(frameRadiusInput?.value || protectedFrame.radius);
  cameraMaskDirty = true;
  updateCameraMaskPreview();
});
toggleRingVisibilityButton?.addEventListener("click", () => {
  protectionGuideVisible = !protectionGuideVisible;
  syncMaskToolButtons();
  redrawToolOverlay();
});
toggleGapHighlightButton?.addEventListener("click", () => {
  gapHighlightVisible = !gapHighlightVisible;
  syncMaskToolButtons();
  modelAdminMessage.textContent = gapHighlightVisible
    ? "Фиолетовым подсвечено все, что еще не стерто на маске камер."
    : "";
  redrawToolOverlay();
});
cutRingButton?.addEventListener("click", stampProtectionGuide);
window.addEventListener("keydown", (event) => {
  const isUndoShortcut = (event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === "z" || event.code === "KeyZ");
  if (!isUndoShortcut) return;

  const activeElement = document.activeElement;
  const tagName = activeElement?.tagName;
  const inputType = String(activeElement?.type || "").toLowerCase();
  const isTextEditing = tagName === "TEXTAREA" ||
    activeElement?.isContentEditable ||
    (tagName === "INPUT" && ["email", "number", "password", "search", "tel", "text", "url"].includes(inputType));

  if (isTextEditing) return;
  event.preventDefault();
  const modelEditorVisible = adminView && !adminView.classList.contains("hidden") &&
    adminEditorSelect?.value === "models" && maskEditor && !maskEditor.classList.contains("hidden");
  if (modelEditorVisible) undoEraser();
  else if (event.shiftKey) redoDesignAction();
  else undoDesignAction();
});

openLoginButton.addEventListener("click", () => navigatePublicRoute("/login"));
openRegisterButton?.addEventListener("click", () => navigatePublicRoute("/register"));
closeAuthButton.addEventListener("click", () => {
  pendingProfileSaveAfterAuth = false;
  authDialog.close();
});
authDialog.addEventListener("cancel", () => {
  pendingProfileSaveAfterAuth = false;
});
authSwitchButton.addEventListener("click", () => setAuthMode(authMode === "login" ? "register" : "login"));
authForgotButton.addEventListener("click", () => setAuthMode("forgot"));
cancelTemplateEditButton.addEventListener("click", resetTemplateEditor);
cancelStickerEditButton?.addEventListener("click", () => resetStickerEditor());
cancelModelEditButton.addEventListener("click", resetModelEditor);
modelCornerPreset?.addEventListener("change", () => {
  adminModelForm.elements.cornerRadius.value = String(radiusForCornerPreset(modelCornerPreset.value));
  renderAdminModelPreview();
});
resetCameraLayoutButton?.addEventListener("click", () => {
  adminModelForm.elements.cameraOffsetX.value = "0";
  adminModelForm.elements.cameraOffsetY.value = "0";
  adminModelForm.elements.cameraScale.value = "100";
  updateRangeOutputs();
  renderAdminModelPreview();
});
adminModelForm.addEventListener("input", (event) => {
  if (event.target.name === "cornerRadius" && modelCornerPreset) modelCornerPreset.value = "custom";
  updateRangeOutputs();
  renderAdminModelPreview();
});
adminModelForm.addEventListener("change", (event) => {
  if (event.target.name !== "cornerPreset") renderAdminModelPreview();
});
logoutButton.addEventListener("click", () => {
  clearPrivateClientState();
  clearStoredSession();
  resetSupportChatIdentity();
  currentUser = null;
  updateAuthUi();
});
openAdminButton.addEventListener("click", () => setViewForRole("admin"));
backToClientButton.addEventListener("click", () => setViewForRole("client", true));

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authMessage.textContent = "Проверяю данные...";
  try {
    if (authMode === "register") {
      const email = authEmail.value.trim().toLowerCase();
      const result = await authRequest("/api/auth/register", {
        name: authName.value,
        email,
        password: authPassword.value
      });
      if (result.token && result.user) {
        return;
      }
      pendingVerificationEmail = result.email || email;
      setAuthMode("verify");
      authEmail.value = pendingVerificationEmail;
      authCode.value = "";
      authCode.focus();
      authMessage.textContent = result.message || "Введите код из письма.";
      return;
    }

    if (authMode === "login") {
      await authRequest("/api/auth/login", {
        email: authEmail.value,
        password: authPassword.value
      });
      return;
    }

    if (authMode === "verify") {
      await authRequest("/api/auth/verify-email", {
        email: authEmail.value,
        code: authCode.value
      });
      return;
    }

    if (authMode === "forgot") {
      const result = await authRequest("/api/auth/forgot-password", {
        email: authEmail.value
      });
      authMessage.textContent = result.message || "Письмо отправлено.";
      return;
    }

    if (authMode === "reset") {
      const result = await authRequest("/api/auth/reset-password", {
        token: resetPasswordToken,
        password: authPassword.value
      });
      resetPasswordToken = null;
      setAuthMode("login");
      authMessage.textContent = result.message || "Пароль обновлен.";
    }
  } catch (error) {
    if (error.details?.emailVerificationRequired) {
      pendingVerificationEmail = error.details.email || authEmail.value.trim().toLowerCase();
      setAuthMode("verify");
      authEmail.value = pendingVerificationEmail;
      authCode.value = "";
      authCode.focus();
      authMessage.textContent = error.message;
      return;
    }
    authMessage.textContent = error.message;
  }
});

adminTemplateForm.addEventListener("submit", async (event) => {
  // The text editor is temporarily mounted inside this form while an admin
  // builds a template. Its own submit event must never create a template.
  if (event.target !== adminTemplateForm) return;
  event.preventDefault();
  templateAdminMessage.textContent = editingTemplateId ? "Сохраняю макет..." : "Загружаю макет...";
  try {
    const wasEditing = Boolean(editingTemplateId);
    const formData = new FormData(adminTemplateForm);
    formData.set("templateData", JSON.stringify(designStatePayload({ includeModel: false, relativeLayers: true })));
    const imageFile = formData.get("image");
    const hasImageFile = Boolean(imageFile?.name);
    if (!hasImageFile && userLayers.length > 0) {
      formData.set("image", dataUrlToFile(caseSnapshotDataUrl({ withCamera: true }), "template-preview.png"));
    } else if (!wasEditing && !hasImageFile) {
      templateAdminMessage.textContent = "Соберите макет в редакторе и сохраните его.";
      return;
    }
    const result = await adminRequest(editingTemplateId ? `/api/admin/templates/${editingTemplateId}` : "/api/admin/templates", {
      method: editingTemplateId ? "PUT" : "POST",
      body: formData
    });
    let message = result.message || (wasEditing ? "Макет сохранен." : "Макет добавлен.");
    syncLayerSourceUrlsFromTemplateData(result.templateData);
    resetTemplateEditor();
    templateAdminMessage.textContent = message;
    refreshTemplatesAfterAdminMutation().catch((error) => {
      templateAdminMessage.textContent = error.message || "Макет сохранен, но список пока не обновился.";
    });
  } catch (error) {
    templateAdminMessage.textContent = error.message;
  }
});

adminStickerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const wasEditing = Boolean(editingStickerId);
  stickerAdminMessage.textContent = wasEditing ? "Сохраняю стикер..." : "Загружаю стикер...";
  const formData = new FormData(adminStickerForm);
  const imageFile = formData.get("image");
  if (!wasEditing && !imageFile?.name) {
    stickerAdminMessage.textContent = "Выберите PNG или WEBP с прозрачным фоном.";
    return;
  }
  try {
    const result = await adminRequest(wasEditing ? `/api/admin/stickers/${editingStickerId}` : "/api/admin/stickers", {
      method: wasEditing ? "PUT" : "POST",
      body: formData
    });
    resetStickerEditor({ keepMessage: true });
    stickerAdminMessage.textContent = result.message || (wasEditing ? "Стикер сохранён." : "Стикер добавлен.");
    await refreshStickersAfterAdminMutation();
  } catch (error) {
    stickerAdminMessage.textContent = error.message;
  }
});

adminModelForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  modelAdminMessage.textContent = editingModelId ? "Сохраняю модель..." : "Добавляю модель...";
  const formData = new FormData(adminModelForm);
  formData.set("cameraScale", String(Number(cameraScaleInput?.value || 100) / 100));
  formData.set("usePhoneImageForCamera", usePhoneImageForCamera ? "1" : "0");
  const phoneFile = phoneImageInput?.files[0];
  const cameraFile = cameraImageInput?.files[0];
  if (!editingModelId && !phoneFile) {
    modelAdminMessage.textContent = "Загрузите фото модели.";
    return;
  }
  if (!editingModelId && !cameraMaskImage) {
    modelAdminMessage.textContent = "Откройте фото модели и обработайте камеры ластиком.";
    return;
  }
  if (cameraMaskImage && (!editingModelId || cameraMaskDirty)) {
    formData.set("cameraMaskDataUrl", exportCameraMaskDataUrl());
    formData.set("cameraWorkDataUrl", exportCameraWorkDataUrl());
  }
  if (cameraMaskImage) {
    formData.set("cameraEditorState", JSON.stringify(cameraEditorStatePayload()));
  }
  try {
    const wasEditing = Boolean(editingModelId);
    const result = await adminRequest(editingModelId ? `/api/admin/models/${editingModelId}` : "/api/admin/models", {
      method: editingModelId ? "PUT" : "POST",
      body: formData
    });
    const message = result.message || (wasEditing ? "Модель сохранена." : "Модель добавлена.");
    resetModelEditor();
    await refreshModelsAfterAdminMutation({ refreshTemplates: wasEditing });
    modelAdminMessage.textContent = message;
  } catch (error) {
    modelAdminMessage.textContent = error.message;
  }
});

adminModelCategoryForm?.addEventListener("submit", (event) => submitCategoryForm(
  event,
  "/api/admin/phone-model-categories",
  modelCategoryMessage
));

adminTemplateCategoryForm?.addEventListener("submit", (event) => submitCategoryForm(
  event,
  "/api/admin/template-categories",
  templateCategoryMessage
));

adminStickerCategoryForm?.addEventListener("submit", (event) => submitCategoryForm(
  event,
  "/api/admin/sticker-categories",
  stickerCategoryMessage
));

modelCategorySelect?.addEventListener("change", async () => {
  selectedModelCategoryId = modelCategorySelect.value;
  await loadModels();
});

modelSearchInput?.addEventListener("input", () => {
  window.clearTimeout(modelSearchInput._searchTimer);
  modelSearchInput._searchTimer = window.setTimeout(() => loadModels(), 250);
});

saveButton.addEventListener("click", () => openSaveChoiceDialog());
closeSaveChoiceButton?.addEventListener("click", () => saveChoiceDialog.close());
saveFileChoiceButton?.addEventListener("click", saveDesignAsFile);
saveProfileChoiceButton?.addEventListener("click", saveDesignFromChoiceToProfile);

canvas.addEventListener("pointerdown", startDrag);
canvas.addEventListener("pointermove", moveDrag);
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);
canvas.addEventListener("lostpointercapture", (event) => {
  if (canvasPointers.has(event.pointerId)) endDrag(event);
});
window.addEventListener("resize", updateMaskCanvasDisplay);

async function init() {
  ensureCategoryControls();
  ensureModelPicker();
  showAdminEditor("models");
  updateRangeOutputs();
  restoreCachedSession();
  restoreCachedModels();
  restoreCachedTemplates();
  restoreCachedStickers();
  await loadCategories();
  await Promise.allSettled([
    loadModels(),
    loadTemplates(),
    loadStickers(),
    checkSession()
  ]);
  await handleAuthLinks();
  applyPublicRoute();
  await document.fonts?.ready;
  window.setTimeout(() => applyPublicRoute({ runAction: false }), 120);
}

init();
