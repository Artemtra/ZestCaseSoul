import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import multer from "multer";
import mysql from "mysql2/promise";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectPaths = Object.freeze({
  root: __dirname,
  assets: path.join(__dirname, "assets"),
  uploads: path.join(__dirname, "uploads")
});
const apiPrefix = "/api";
const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";
const uploadsDir = projectPaths.uploads;
const authSecret = String(process.env.AUTH_SECRET || "").trim();
if (authSecret.length < 32) {
  throw new Error("AUTH_SECRET must be set in .env and contain at least 32 characters.");
}
const appUrl = (process.env.APP_URL || `http://localhost:${port}`).replace(/\/$/, "");
const emailVerificationEnabled = String(process.env.VERIFICATION_METHOD || "email").toLowerCase() !== "none";
const paymentProvider = String(process.env.PAYMENT_PROVIDER || "yookassa").toLowerCase();
const paymentTestMode = String(process.env.PAYMENT_TEST_MODE || "false").toLowerCase() === "true";
const yookassaShopId = process.env.YOOKASSA_SHOP_ID || "";
const yookassaSecretKey = process.env.YOOKASSA_SECRET_KEY || "";
const defaultDeliveryAmount = Number(process.env.DEFAULT_DELIVERY_AMOUNT || 0);
const legalDocumentVersion = "2026-07-29";
const allowedImageTypes = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"]
]);
const allowedImageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const maxDesignImages = 10;
const maxDesignTexts = 7;
const corsOrigins = new Set([
  appUrl,
  `http://localhost:${port}`,
  `http://127.0.0.1:${port}`,
  ...String(process.env.APP_ALLOWED_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean)
]);

fs.mkdirSync(uploadsDir, { recursive: true });

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "case_editor",
  waitForConnections: true,
  connectionLimit: 10
});

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedImageExtensions.has(extension)) {
      callback(new Error("Разрешены только PNG, JPG и WEBP."));
      return;
    }
    callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, fieldSize: 25 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedImageTypes.has(file.mimetype) || !allowedImageExtensions.has(extension)) {
      callback(new Error("Разрешены только изображения PNG, JPG и WEBP."));
      return;
    }
    callback(null, true);
  }
});

const modelUpload = upload.fields([
  { name: "phoneImage", maxCount: 1 },
  { name: "cameraImage", maxCount: 1 }
]);

const immutableImageCache = {
  maxAge: "365d",
  immutable: true,
  etag: true,
  setHeaders(res) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }
};

const assetCache = {
  maxAge: "1d",
  etag: true
};

app.use(express.json({ limit: "25mb" }));
app.use((req, res, next) => {
  const origin = req.header("origin");
  if (origin && corsOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
app.options("*", (req, res) => {
  const origin = req.header("origin");
  if (origin && !corsOrigins.has(origin)) {
    res.sendStatus(403);
    return;
  }
  res.sendStatus(204);
});
const publicFiles = Object.freeze([
  { route: "/", file: "index.html", cache: "public, max-age=0, must-revalidate" },
  { route: "/index.html", file: "index.html", cache: "public, max-age=0, must-revalidate" },
  { route: "/error", file: "error.html", cache: "no-store" },
  { route: "/error.html", file: "error.html", cache: "no-store" },
  { route: "/styles.css", file: "styles.css", cache: "public, max-age=86400, stale-while-revalidate=604800", type: "text/css" },
  { route: "/mobile.css", file: "mobile.css", cache: "public, max-age=86400, stale-while-revalidate=604800", type: "text/css" },
  { route: "/script.js", file: "script.js", cache: "public, max-age=86400, stale-while-revalidate=604800", type: "application/javascript" },
  { route: "/mobile-ui.js", file: "mobile-ui.js", cache: "public, max-age=86400, stale-while-revalidate=604800", type: "application/javascript" },
  { route: "/robots.txt", file: "robots.txt", cache: "public, max-age=3600", type: "text/plain" },
  { route: "/sitemap.xml", file: "sitemap.xml", cache: "public, max-age=3600", type: "application/xml" },
  { route: "/site.webmanifest", file: "site.webmanifest", cache: "public, max-age=86400", type: "application/manifest+json" }
]);

const publicApplicationRoutes = Object.freeze([
  { path: "/constructor", indexable: true },
  { path: "/templates", indexable: true },
  { path: "/models", indexable: true },
  { path: "/how-it-works", indexable: true },
  { path: "/faq", indexable: true },
  { path: "/about", indexable: true },
  { path: "/contacts", indexable: true },
  { path: "/delivery", indexable: true },
  { path: "/returns", indexable: true },
  { path: "/payment", indexable: true },
  { path: "/offer", indexable: true },
  { path: "/privacy", indexable: true },
  { path: "/login", indexable: false },
  { path: "/register", indexable: false },
  { path: "/profile", indexable: false },
  { path: "/designs", indexable: false },
  { path: "/orders", indexable: false }
]);

const publicRedirects = Object.freeze({
  "/create": "/constructor",
  "/editor": "/constructor",
  "/design": "/constructor",
  "/catalog": "/models",
  "/cases": "/models",
  "/help": "/faq",
  "/shipping": "/delivery",
  "/dostavka": "/delivery",
  "/oplata": "/payment"
});

function sendProjectFile(res, file, { cache, type } = {}) {
  if (cache) res.setHeader("Cache-Control", cache);
  if (type) res.type(type);
  res.sendFile(path.join(projectPaths.root, file));
}

function sendApplicationPage(req, res, { indexable = true } = {}) {
  const pagePath = req.path === "/" ? "" : req.path;
  res.setHeader("Link", `<${appUrl}${pagePath}>; rel="canonical"`);
  if (!indexable) res.setHeader("X-Robots-Tag", "noindex, noarchive");
  sendProjectFile(res, "index.html", { cache: indexable ? "public, max-age=0, must-revalidate" : "private, no-store" });
}

app.use((req, res, next) => {
  if (
    (req.method === "GET" || req.method === "HEAD") &&
    req.path.length > 1 &&
    req.path.endsWith("/") &&
    !req.path.startsWith(`${apiPrefix}/`) &&
    !req.path.startsWith("/assets/") &&
    !req.path.startsWith("/uploads/")
  ) {
    const query = req.originalUrl.slice(req.path.length);
    res.redirect(308, `${req.path.replace(/\/+$/, "")}${query}`);
    return;
  }
  next();
});

app.use("/uploads", express.static(projectPaths.uploads, { ...immutableImageCache, dotfiles: "deny" }));
app.use("/assets", express.static(projectPaths.assets, { ...assetCache, dotfiles: "deny" }));
for (const publicFile of publicFiles) {
  app.get(publicFile.route, (_req, res) => sendProjectFile(res, publicFile.file, publicFile));
}
for (const route of publicApplicationRoutes) {
  app.get(route.path, (req, res) => sendApplicationPage(req, res, route));
}
for (const [source, destination] of Object.entries(publicRedirects)) {
  app.get(source, (_req, res) => res.redirect(308, destination));
}
app.get("/products/:slug", (req, res) => {
  const slug = String(req.params.slug || "").toLowerCase();
  if (!/^[a-z0-9-]{2,120}$/.test(slug)) {
    res.status(404);
    sendProjectFile(res, "error.html", { cache: "no-store" });
    return;
  }
  // The client already loads the public model catalog. Avoid a duplicate DB query
  // merely to decide whether the SPA shell can be served for this URL.
  sendApplicationPage(req, res);
});

function sendHealth(_req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.json({ ok: true, service: "zestcasesoul", uptimeSeconds: Math.floor(process.uptime()) });
}

app.get("/healthz", sendHealth);
app.get(`${apiPrefix}/health`, sendHealth);
app.get(`${apiPrefix}/public/routes`, (_req, res) => {
  setPublicCache(res, 3600);
  res.json({
    routes: ["/", ...publicApplicationRoutes.filter((route) => route.indexable).map((route) => route.path), "/products/:slug"],
    redirects: publicRedirects
  });
});
app.get(`${apiPrefix}/public/config`, (_req, res) => {
  setPublicCache(res, 3600);
  res.json({
    currency: "RUB",
    defaultDeliveryAmount,
    maxDesignImages,
    maxDesignTexts,
    paymentProvider,
    paymentTestMode
  });
});
// Подтверждение владения сайтом для Google Search Console.
// Не удаляйте и не переименовывайте этот маршрут после подтверждения.
app.get("/google44cb75a03354cfb4.html", (_req, res) => {
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.type("text/plain");
  res.send("google-site-verification: google44cb75a03354cfb4.html");
});
function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-я]+/gi, "-")
    .replace(/^-|-$/g, "");
}

function detectImageType(buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  return null;
}

function imageDimensions(buffer, type) {
  if (type === "png" && buffer.length >= 24) return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  if (type === "webp" && buffer.length >= 30) {
    const chunkType = buffer.subarray(12, 16).toString("ascii");
    if (chunkType === "VP8X") {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3)
      };
    }
    if (chunkType === "VP8 ") {
      // Lossy WebP stores the dimensions after the VP8 start code.
      const startCode = buffer.indexOf(Buffer.from([0x9d, 0x01, 0x2a]), 20);
      if (startCode >= 0 && startCode + 7 <= buffer.length) {
        return {
          width: buffer.readUInt16LE(startCode + 3) & 0x3fff,
          height: buffer.readUInt16LE(startCode + 5) & 0x3fff
        };
      }
    }
    if (chunkType === "VP8L" && buffer.length >= 25 && buffer[20] === 0x2f) {
      const bits = buffer.readUInt32LE(21);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1
      };
    }
    return null;
  }
  if (type === "jpg") {
    for (let offset = 2; offset + 9 < buffer.length;) {
      if (buffer[offset] !== 0xff) { offset += 1; continue; }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xc3 && length >= 7) return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      offset += 2 + length;
    }
  }
  return null;
}

function isSafeImageBuffer(buffer, expectedType = null) {
  const type = detectImageType(buffer);
  if (!type || (expectedType && type !== expectedType)) return false;
  const dimensions = imageDimensions(buffer, type);
  return Boolean(dimensions) && dimensions.width >= 1 && dimensions.height >= 1 && dimensions.width <= 12000 && dimensions.height <= 12000;
}

function removeUploadedFile(file) {
  if (!file?.path) return;
  fs.rmSync(file.path, { force: true });
}

function uploadedImageUrl(file) {
  if (!file) return null;
  const expectedType = allowedImageTypes.get(file.mimetype);
  try {
    const buffer = fs.readFileSync(file.path);
    if (!expectedType || !isSafeImageBuffer(buffer, expectedType)) {
      removeUploadedFile(file);
      return null;
    }
  } catch {
    removeUploadedFile(file);
    return null;
  }
  return `/uploads/${file.filename}`;
}

function uploadedStickerImageUrl(file) {
  const extension = path.extname(file?.originalname || "").toLowerCase();
  if (!file || !["image/png", "image/webp"].includes(file.mimetype) || ![".png", ".webp"].includes(extension)) {
    removeUploadedFile(file);
    return null;
  }
  return uploadedImageUrl(file);
}

function setShortCache(res, seconds = 30) {
  res.setHeader("Cache-Control", `private, max-age=${seconds}, stale-while-revalidate=${seconds * 10}`);
}

function setPublicCache(res, seconds = 60) {
  res.setHeader("Cache-Control", `public, max-age=${seconds}, s-maxage=${seconds}, stale-while-revalidate=${seconds * 10}`);
}

const publicDataCache = new Map();
const publicDataRequests = new Map();
const publicDataVersions = new Map();
const publicDataCacheTtlMs = 60_000;

async function getCachedPublicData(key, loader, ttlMs = publicDataCacheTtlMs) {
  const cached = publicDataCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  if (publicDataRequests.has(key)) return publicDataRequests.get(key);

  const version = publicDataVersions.get(key) || 0;
  let request;
  request = Promise.resolve()
    .then(loader)
    .then((value) => {
      if ((publicDataVersions.get(key) || 0) === version) {
        publicDataCache.set(key, { value, expiresAt: Date.now() + ttlMs });
      }
      return value;
    })
    .finally(() => {
      if (publicDataRequests.get(key) === request) publicDataRequests.delete(key);
    });
  publicDataRequests.set(key, request);
  return request;
}

function invalidatePublicData(...keys) {
  for (const key of keys) {
    publicDataVersions.set(key, (publicDataVersions.get(key) || 0) + 1);
    publicDataCache.delete(key);
    publicDataRequests.delete(key);
  }
}

function parseImageDataUrl(dataUrl, allowedTypes = new Set(["png", "jpeg", "jpg", "webp"])) {
  const value = String(dataUrl || "");
  const match = value.match(/^data:image\/(png|jpe?g|webp);base64,([a-z0-9+/=]+)$/i);
  if (!match) return null;

  const type = match[1].toLowerCase() === "jpg" ? "jpeg" : match[1].toLowerCase();
  if (!allowedTypes.has(type)) return null;
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length === 0 || buffer.length > 8 * 1024 * 1024 || !isSafeImageBuffer(buffer, type === "jpeg" ? "jpg" : type)) return null;
  const extension = type === "jpeg" ? "jpg" : type;
  return { buffer, extension };
}

async function saveImageDataUrl(dataUrl, suffix = "image", allowedTypes = new Set(["png", "jpeg", "jpg", "webp"])) {
  const image = parseImageDataUrl(dataUrl, allowedTypes);
  if (!image) return null;

  const safeSuffix = String(suffix).replace(/[^a-z0-9-]/gi, "") || "image";
  const filename = `${Date.now()}-${crypto.randomUUID()}-${safeSuffix}.${image.extension}`;
  await fs.promises.writeFile(path.join(uploadsDir, filename), image.buffer);
  return `/uploads/${filename}`;
}

function savePngDataUrl(dataUrl, suffix = "image") {
  return saveImageDataUrl(dataUrl, suffix, new Set(["png", "webp"]));
}

function saveMaskDataUrl(dataUrl) {
  return savePngDataUrl(dataUrl, "camera-mask");
}

function normalizeEditorState(value) {
  try {
    return JSON.stringify(JSON.parse(String(value || "{}")));
  } catch {
    return "{}";
  }
}

function parseJsonValue(value, fallbackValue) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value || "null") : value;
    return parsed ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function toMoney(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.round(number * 100) / 100);
}

function formatMoney(value) {
  return toMoney(value).toFixed(2);
}

function createOrderNumber() {
  const date = new Date();
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("");
  return `ZCS-${stamp}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

async function writeAudit({ userId = null, action, entityType, entityId = null, oldData = null, newData = null, req = null }) {
  try {
    await pool.query(
      `INSERT INTO admin_audit_log (user_id, action, entity_type, entity_id, old_data, new_data, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        entityType,
        entityId ? String(entityId) : null,
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null,
        req?.ip || null,
        req?.headers?.["user-agent"] || null
      ]
    );
  } catch (error) {
    console.warn(`[audit] ${error.message}`);
  }
}

async function addOrderHistory(connection, orderId, oldStatus, newStatus, userId, comment) {
  await connection.query(
    `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by_user_id, comment)
     VALUES (?, ?, ?, ?, ?)`,
    [orderId, oldStatus || null, newStatus, userId || null, comment || null]
  );
}

function orderStatusFromPayment(order) {
  if (order.status === "cancelled") return "cancelled";
  if (order.status === "delivered") return "delivered";
  if (order.status === "shipped") return "shipped";
  if (order.status === "in_production") return "in_production";
  if (order.payment_status === "paid") return "paid";
  return "new";
}

function canTransitionOrder(oldStatus, newStatus) {
  const transitions = {
    new: new Set(["cancelled"]),
    paid: new Set(["in_production", "cancelled"]),
    in_production: new Set(["ready", "cancelled"]),
    ready: new Set(["shipped", "cancelled"]),
    shipped: new Set(["delivered", "cancelled"]),
    delivered: new Set([]),
    cancelled: new Set([])
  };
  return transitions[oldStatus]?.has(newStatus) || false;
}

async function createPaymentForOrder(order) {
  if (paymentTestMode) {
    return {
      provider: "test",
      paymentId: `test-${order.order_number}`,
      confirmationUrl: `${appUrl}/?order=${encodeURIComponent(order.order_number)}&payment=test`
    };
  }

  if (paymentProvider !== "yookassa") {
    throw new Error("PAYMENT_PROVIDER must be yookassa or enable PAYMENT_TEST_MODE=true for local testing.");
  }

  if (!yookassaShopId || !yookassaSecretKey) {
    throw new Error("YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY are required to create a real payment.");
  }

  const idempotenceKey = order.payment_idempotence_key || crypto.randomUUID();
  const response = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${yookassaShopId}:${yookassaSecretKey}`).toString("base64")}`,
      "Content-Type": "application/json",
      "Idempotence-Key": idempotenceKey
    },
    body: JSON.stringify({
      amount: { value: formatMoney(order.total_amount), currency: order.currency || "RUB" },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: `${appUrl}/?order=${encodeURIComponent(order.order_number)}`
      },
      description: `ZestCaseSoul ${order.order_number}`,
      metadata: {
        orderId: String(order.id),
        orderNumber: order.order_number,
        userId: String(order.user_id)
      }
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.description || payload?.message || `YooKassa payment error ${response.status}`);
  }

  return {
    provider: "yookassa",
    paymentId: payload.id,
    idempotenceKey,
    confirmationUrl: payload.confirmation?.confirmation_url || null
  };
}

async function normalizeDesignPayloadAssets(sourceImagesValue, designStateValue) {
  const sourceImages = parseJsonValue(sourceImagesValue || "[]", []);
  const designState = parseJsonValue(designStateValue || "{}", {});
  const designLayers = Array.isArray(designState?.layers) ? designState.layers : [];
  const imageLayerCount = designLayers.filter((layer) => layer && typeof layer === "object" && layer.type !== "text" && layer.sourceUrl).length;
  const textLayerCount = designLayers.filter((layer) => layer && typeof layer === "object" && layer.type === "text").length;
  const sourceImageCount = Array.isArray(sourceImages)
    ? sourceImages.filter((item) => (item && typeof item === "object" ? item.sourceUrl : item)).length
    : 0;
  if (imageLayerCount > maxDesignImages || sourceImageCount > maxDesignImages) {
    throw new Error(`Можно добавить не больше ${maxDesignImages} фотографий.`);
  }
  if (textLayerCount > maxDesignTexts) {
    throw new Error(`Можно добавить не больше ${maxDesignTexts} надписей.`);
  }
  const savedSources = new Map();

  async function normalizeSourceUrl(sourceUrl) {
    const value = String(sourceUrl || "");
    if (!value.startsWith("data:image/")) return value;
    if (savedSources.has(value)) return savedSources.get(value);
    const savedUrl = await saveImageDataUrl(value, "source-image");
    savedSources.set(value, savedUrl || "");
    return savedUrl || "";
  }

  const normalizedSourceImages = Array.isArray(sourceImages)
    ? await Promise.all(sourceImages.map(async (item) => {
      const source = item && typeof item === "object" ? { ...item } : { sourceUrl: item };
      source.sourceUrl = await normalizeSourceUrl(source.sourceUrl);
      return source;
    }))
    : [];

  const normalizedDesignState = designState && typeof designState === "object" && !Array.isArray(designState)
    ? { ...designState }
    : {};

  if (Array.isArray(normalizedDesignState.layers)) {
    normalizedDesignState.layers = await Promise.all(normalizedDesignState.layers.map(async (layer) => {
      const normalizedLayer = layer && typeof layer === "object" ? { ...layer } : {};
      normalizedLayer.sourceUrl = await normalizeSourceUrl(normalizedLayer.sourceUrl);
      return normalizedLayer;
    }));
  }

  return {
    sourceImagesJson: JSON.stringify(normalizedSourceImages),
    designStateJson: JSON.stringify(normalizedDesignState)
  };
}

async function normalizeTemplateDataPayload(templateDataValue) {
  if (!templateDataValue) return null;
  const { designStateJson } = await normalizeDesignPayloadAssets("[]", templateDataValue);
  return designStateJson;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, originalHash] = String(storedHash).split(":");
  if (!salt || !originalHash) return false;
  const candidate = hashPassword(password, salt).split(":")[1];
  if (candidate.length !== originalHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(originalHash, "hex"));
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", authSecret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verifyToken(token) {
  const [body, signature] = String(token || "").split(".");
  if (!body || !signature) return null;
  const expected = crypto.createHmac("sha256", authSecret).update(body).digest("base64url");
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (payload.exp && payload.exp < Date.now()) return null;
  return payload;
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePublic: Boolean(user.profile_public ?? user.profilePublic),
    avatarOptionId: user.avatar_option_id ?? user.avatarOptionId ?? null,
    avatarUrl: user.avatar_url ?? user.avatarUrl ?? null,
    emailVerified: Boolean(user.email_verified_at ?? user.emailVerified)
  };
}

function maskedEmail(email) {
  const value = String(email || "");
  const [name] = value.split("@");
  const prefix = (name || value).slice(0, 3);
  return `${prefix}***`;
}

function randomToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function randomVerificationCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function hashVerificationCode(userId, code) {
  return hashToken(`${userId}:${String(code || "").trim()}`);
}

async function sendResendMail({ to, subject, text, html }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "onboarding@resend.dev",
      to,
      subject,
      html: html || `<p>${String(text || "").replace(/\n/g, "<br>")}</p>`,
      text
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    if (response.status === 403 && errorBody.includes("You can only send testing emails")) {
      throw new Error("Resend в тестовом режиме отправляет письма только на почту владельца аккаунта. Чтобы отправлять коды другим людям, подтвердите домен в Resend и укажите RESEND_FROM с этого домена.");
    }
    throw new Error(`Resend error ${response.status}: ${errorBody}`);
  }
}

async function sendMail({ to, subject, text, html }) {
  if (process.env.RESEND_API_KEY) {
    await sendResendMail({ to, subject, text, html });
    return;
  }

  const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD;

  if (!hasSmtp) {
    console.log(`[mail:dev] ${subject}\nTo: ${to}\n${text}`);
    return;
  }

  try {
    const { default: nodemailer } = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false") === "true",
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user: process.env.SMTP_USER,
        pass: String(process.env.SMTP_PASSWORD || "").replace(/\s+/g, "")
      }
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html
    });
  } catch (error) {
    if (["ECONNREFUSED", "ETIMEDOUT", "ECONNRESET", "ESOCKET"].includes(error.code)) {
      console.warn(`[mail:fallback] SMTP unavailable: ${error.message}`);
      console.log(`[mail:fallback] ${subject}\nTo: ${to}\n${text}`);
      if (String(process.env.VERIFICATION_METHOD || "").toLowerCase() === "email") {
        throw error;
      }
      return;
    }
    throw error;
  }
}

async function createOneTimeToken(tableName, userId, expiresInMinutes) {
  const allowedTables = new Set(["email_verification_tokens", "password_reset_tokens"]);
  if (!allowedTables.has(tableName)) throw new Error("Invalid token table.");

  const token = randomToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  await pool.query(`UPDATE ${tableName} SET consumed_at = CURRENT_TIMESTAMP WHERE user_id = ? AND consumed_at IS NULL`, [userId]);
  await pool.query(`INSERT INTO ${tableName} (user_id, token_hash, expires_at) VALUES (?, ?, ?)`, [userId, tokenHash, expiresAt]);

  return token;
}

async function createEmailVerificationCode(userId, expiresInMinutes = 15) {
  const code = randomVerificationCode();
  const tokenHash = hashVerificationCode(userId, code);
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  await pool.query("DELETE FROM email_verification_tokens WHERE user_id = ?", [userId]);
  await pool.query(
    "INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [userId, tokenHash, expiresAt]
  );

  return code;
}

async function sendVerificationEmail(user) {
  const code = await createEmailVerificationCode(user.id);

  await sendMail({
    to: user.email,
    subject: "Код подтверждения почты ZestCaseSoul",
    text: `Ваш код подтверждения ZestCaseSoul: ${code}. Код действует 15 минут.`,
    html: `<p>Ваш код подтверждения ZestCaseSoul:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>Код действует 15 минут.</p>`
  });
}

async function sendPasswordResetEmail(user) {
  const token = await createOneTimeToken("password_reset_tokens", user.id, 60);
  const resetUrl = `${appUrl}/?resetPasswordToken=${encodeURIComponent(token)}`;

  await sendMail({
    to: user.email,
    subject: "Восстановление пароля ZestCaseSoul",
    text: `Чтобы восстановить пароль, откройте ссылку: ${resetUrl}`,
    html: `<p>Чтобы восстановить пароль ZestCaseSoul, откройте ссылку:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
  });
}

async function requireAuth(req, res, next) {
  try {
    const header = req.header("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ error: "Нужно войти в аккаунт." });
      return;
    }

    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.email_verified_at, u.profile_public, u.avatar_option_id, ao.image_url AS avatar_url
       FROM users u
       LEFT JOIN avatar_options ao ON ao.id = u.avatar_option_id AND ao.is_active = 1
       WHERE u.id = ?`,
      [payload.userId]
    );
    if (rows.length === 0) {
      res.status(401).json({ error: "Пользователь не найден." });
      return;
    }

    req.user = rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Доступ только для администратора." });
    return;
  }
  next();
}

function requireExecutor(req, res, next) {
  if (!["admin", "executor"].includes(req.user?.role)) {
    res.status(403).json({ error: "Доступ только для исполнителя." });
    return;
  }
  next();
}

function readCategoryPayload(body) {
  const name = String(body.name || "").trim();
  const slug = slugify(body.slug || name);
  const isActive = !(body.isActive === false || body.isActive === "false" || body.isActive === "0" || body.is_active === 0);
  if (!name || !slug) return null;
  return { name, slug, isActive };
}

async function listCategories(tableName, itemTableName, includeEmpty = false) {
  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.slug, c.sort_order AS sortOrder, c.is_active AS isActive, COUNT(item.id) AS itemsCount
     FROM ${tableName} c
     LEFT JOIN ${itemTableName} item ON item.category_id = c.id AND item.is_active = 1
     WHERE c.is_active = 1 OR ?
     GROUP BY c.id
     HAVING ? OR (c.is_active = 1 AND COUNT(item.id) > 0)
     ORDER BY c.sort_order, c.id`,
    [includeEmpty ? 1 : 0, includeEmpty ? 1 : 0]
  );
  return rows.map((row) => ({ ...row, isActive: Boolean(row.isActive), itemsCount: Number(row.itemsCount || 0) }));
}

function listCachedCategories(cacheKey, tableName, itemTableName, includeEmpty = false) {
  return getCachedPublicData(
    cacheKey,
    () => listCategories(tableName, itemTableName, true)
  ).then((rows) => includeEmpty ? rows : rows.filter((row) => row.isActive && row.itemsCount > 0));
}

async function createCategory(tableName, payload) {
  const [orderRows] = await pool.query(`SELECT COALESCE(MAX(sort_order), 0) + 1 AS nextSortOrder FROM ${tableName}`);
  const sortOrder = Number(orderRows[0]?.nextSortOrder || 1);
  const [result] = await pool.query(
    `INSERT INTO ${tableName} (name, slug, sort_order, is_active) VALUES (?, ?, ?, ?)`,
    [payload.name, payload.slug, sortOrder, payload.isActive ? 1 : 0]
  );
  return { id: result.insertId, ...payload, sortOrder };
}

async function updateCategory(tableName, id, payload) {
  await pool.query(
    `UPDATE ${tableName} SET name = ?, slug = ?, is_active = ? WHERE id = ?`,
    [payload.name, payload.slug, payload.isActive ? 1 : 0, id]
  );
  const [rows] = await pool.query(
    `SELECT id, name, slug, sort_order AS sortOrder, is_active AS isActive FROM ${tableName} WHERE id = ? LIMIT 1`,
    [id]
  );
  if (!rows.length) return null;
  return { ...rows[0], isActive: Boolean(rows[0].isActive) };
}

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email || password.length < 6) {
      res.status(400).json({ error: "Введите имя, email и пароль минимум 6 символов." });
      return;
    }

    const [existing] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.email_verified_at, u.profile_public, u.avatar_option_id, ao.image_url AS avatar_url
       FROM users u
       LEFT JOIN avatar_options ao ON ao.id = u.avatar_option_id AND ao.is_active = 1
       WHERE u.email = ?`,
      [email]
    );
    if (existing.length > 0) {
      if (!existing[0].email_verified_at) {
        const passwordHash = hashPassword(password);
        if (!emailVerificationEnabled) {
          await pool.query("UPDATE users SET name = ?, password_hash = ?, email_verified_at = CURRENT_TIMESTAMP WHERE id = ?", [name, passwordHash, existing[0].id]);
          const verifiedUser = { ...existing[0], name, email_verified_at: new Date() };
          const token = signToken({ userId: verifiedUser.id, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 });
          res.json({ token, user: publicUser(verifiedUser) });
          return;
        }
        await pool.query("UPDATE users SET name = ?, password_hash = ? WHERE id = ?", [name, passwordHash, existing[0].id]);
        await sendVerificationEmail({ ...existing[0], name });
        res.json({
          message: "Мы отправили новый 6-значный код для подтверждения почты.",
          email,
          emailVerificationRequired: true
        });
        return;
      }

      res.status(409).json({ error: "Пользователь с таким email уже есть." });
      return;
    }

    const [countRows] = await pool.query("SELECT COUNT(*) AS total FROM users");
    const role = Number(countRows[0].total) === 0 ? "admin" : "client";
    const passwordHash = hashPassword(password);
    const [result] = emailVerificationEnabled
      ? await pool.query(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        [name, email, passwordHash, role]
      )
      : await pool.query(
        "INSERT INTO users (name, email, password_hash, role, email_verified_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
        [name, email, passwordHash, role]
      );

    const user = { id: result.insertId, name, email, role, profile_public: 0, avatar_option_id: null, avatar_url: null, email_verified_at: emailVerificationEnabled ? null : new Date() };
    if (!emailVerificationEnabled) {
      const token = signToken({ userId: user.id, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 });
      res.status(201).json({ token, user: publicUser(user) });
      return;
    }

    await sendVerificationEmail(user);
    res.status(201).json({
      message: "Мы отправили 6-значный код для подтверждения почты.",
      email,
      emailVerificationRequired: true
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.role, u.email_verified_at, u.profile_public, u.avatar_option_id, ao.image_url AS avatar_url
       FROM users u
       LEFT JOIN avatar_options ao ON ao.id = u.avatar_option_id AND ao.is_active = 1
       WHERE u.email = ?`,
      [email]
    );

    if (rows.length === 0 || !verifyPassword(password, rows[0].password_hash)) {
      res.status(401).json({ error: "Неверный email или пароль." });
      return;
    }

    const user = rows[0];
    if (!user.email_verified_at && emailVerificationEnabled) {
      await sendVerificationEmail(user);
      res.status(403).json({
        error: "Подтвердите почту. Мы отправили новый код.",
        email: user.email,
        emailVerificationRequired: true
      });
      return;
    }
    if (!user.email_verified_at && !emailVerificationEnabled) {
      await pool.query("UPDATE users SET email_verified_at = CURRENT_TIMESTAMP WHERE id = ?", [user.id]);
      user.email_verified_at = new Date();
    }

    const token = signToken({ userId: user.id, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 });
    res.json({ token, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/verify-email", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const code = String(req.body.code || "").replace(/\D/g, "");
    const token = String(req.body.token || "");
    let rows = [];

    if (email && code) {
      if (code.length !== 6) {
        res.status(400).json({ error: "Введите 6-значный код из письма." });
        return;
      }

      const [codeRows] = await pool.query(
        `SELECT evt.id AS token_id, evt.token_hash, u.id, u.name, u.email, u.role, u.email_verified_at, u.profile_public, u.avatar_option_id, ao.image_url AS avatar_url
         FROM email_verification_tokens evt
         JOIN users u ON u.id = evt.user_id
         LEFT JOIN avatar_options ao ON ao.id = u.avatar_option_id AND ao.is_active = 1
         WHERE u.email = ? AND evt.consumed_at IS NULL AND evt.expires_at > CURRENT_TIMESTAMP
         LIMIT 1`,
        [email]
      );
      rows = codeRows.filter((row) => row.token_hash === hashVerificationCode(row.id, code));
    } else if (token) {
      const tokenHash = hashToken(token);
      const [tokenRows] = await pool.query(
        `SELECT evt.id AS token_id, u.id, u.name, u.email, u.role, u.email_verified_at, u.profile_public, u.avatar_option_id, ao.image_url AS avatar_url
         FROM email_verification_tokens evt
         JOIN users u ON u.id = evt.user_id
         LEFT JOIN avatar_options ao ON ao.id = u.avatar_option_id AND ao.is_active = 1
         WHERE evt.token_hash = ? AND evt.consumed_at IS NULL AND evt.expires_at > CURRENT_TIMESTAMP
         LIMIT 1`,
        [tokenHash]
      );
      rows = tokenRows;
    } else {
      res.status(400).json({ error: "Введите email и код подтверждения." });
      return;
    }

    if (rows.length === 0) {
      res.status(400).json({ error: "Код подтверждения недействителен или устарел." });
      return;
    }

    const user = rows[0];
    await pool.query("UPDATE users SET email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP) WHERE id = ?", [user.id]);
    await pool.query("UPDATE email_verification_tokens SET consumed_at = CURRENT_TIMESTAMP WHERE id = ?", [user.token_id]);

    const verifiedUser = { ...user, email_verified_at: user.email_verified_at || new Date() };
    const sessionToken = signToken({ userId: user.id, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 });
    res.json({ token: sessionToken, user: publicUser(verifiedUser) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/forgot-password", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const [rows] = await pool.query("SELECT id, name, email FROM users WHERE email = ?", [email]);

    if (rows.length > 0) {
      await sendPasswordResetEmail(rows[0]);
    }

    res.json({ message: "Если такой email зарегистрирован, мы отправили письмо для восстановления пароля." });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/reset-password", async (req, res, next) => {
  try {
    const password = String(req.body.password || "");
    const tokenHash = hashToken(String(req.body.token || ""));

    if (password.length < 6) {
      res.status(400).json({ error: "Пароль должен быть минимум 6 символов." });
      return;
    }

    const [rows] = await pool.query(
      `SELECT prt.id AS token_id, u.id AS user_id
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token_hash = ? AND prt.consumed_at IS NULL AND prt.expires_at > CURRENT_TIMESTAMP
       LIMIT 1`,
      [tokenHash]
    );

    if (rows.length === 0) {
      res.status(400).json({ error: "Ссылка восстановления недействительна или устарела." });
      return;
    }

    const passwordHash = hashPassword(password);
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, rows[0].user_id]);
    await pool.query("UPDATE password_reset_tokens SET consumed_at = CURRENT_TIMESTAMP WHERE user_id = ? AND consumed_at IS NULL", [rows[0].user_id]);

    res.json({ message: "Пароль обновлен. Теперь можно войти." });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.post("/api/profile/password-code", requireAuth, async (req, res, next) => {
  try {
    const code = await createEmailVerificationCode(req.user.id);

    await sendMail({
      to: req.user.email,
      subject: "Код смены пароля ZestCaseSoul",
      text: `Ваш код смены пароля ZestCaseSoul: ${code}. Код действует 15 минут.`,
      html: `<p>Ваш код смены пароля ZestCaseSoul:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>Код действует 15 минут.</p>`
    });

    res.json({ message: "Код отправлен на вашу почту." });
  } catch (error) {
    next(error);
  }
});

app.post("/api/profile/password", requireAuth, async (req, res, next) => {
  try {
    const password = String(req.body.password || "");

    if (password.length < 6) {
      res.status(400).json({ error: "Пароль должен быть не короче 6 символов." });
      return;
    }

    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [hashPassword(password), req.user.id]);

    res.json({ message: "Пароль обновлен." });
  } catch (error) {
    next(error);
  }
});

app.put("/api/profile/visibility", requireAuth, async (req, res, next) => {
  try {
    const profilePublic = Boolean(req.body.profilePublic);
    await pool.query("UPDATE users SET profile_public = ? WHERE id = ?", [profilePublic ? 1 : 0, req.user.id]);
    req.user.profile_public = profilePublic ? 1 : 0;
    res.json({ user: publicUser(req.user), message: profilePublic ? "Профиль открыт." : "Профиль скрыт." });
  } catch (error) {
    next(error);
  }
});

app.get("/api/avatars", async (_req, res, next) => {
  try {
    setPublicCache(res, 60);
    const rows = await getCachedPublicData(
      "avatars",
      async () => {
        const [avatarRows] = await pool.query(
          `SELECT id, title, image_url AS imageUrl
           FROM avatar_options
           WHERE is_active = 1
           ORDER BY created_at DESC, id DESC`
        );
        return avatarRows;
      }
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.put("/api/profile/avatar", requireAuth, async (req, res, next) => {
  try {
    const avatarOptionId = Number(req.body.avatarOptionId || 0);
    let avatar = null;

    if (avatarOptionId) {
      const [rows] = await pool.query(
        "SELECT id, image_url AS imageUrl FROM avatar_options WHERE id = ? AND is_active = 1",
        [avatarOptionId]
      );
      if (!rows.length) {
        res.status(400).json({ error: "Выберите доступную аватарку." });
        return;
      }
      avatar = rows[0];
    }

    await pool.query("UPDATE users SET avatar_option_id = ? WHERE id = ?", [avatarOptionId || null, req.user.id]);
    req.user.avatar_option_id = avatar?.id ?? null;
    req.user.avatar_url = avatar?.imageUrl ?? null;
    res.json({ user: publicUser(req.user), message: avatar ? "Аватарка обновлена." : "Аватарка убрана." });
  } catch (error) {
    next(error);
  }
});

app.get("/api/users/:id/profile", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Пользователь не найден." });
      return;
    }

    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.profile_public AS profilePublic, ao.image_url AS avatarUrl, u.created_at AS createdAt
       FROM users u
       LEFT JOIN avatar_options ao ON ao.id = u.avatar_option_id AND ao.is_active = 1
       WHERE u.id = ?`,
      [id]
    );

    if (!users.length) {
      res.status(404).json({ error: "Пользователь не найден." });
      return;
    }

    const user = users[0];
    const isPublic = Boolean(user.profilePublic);
    const response = {
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        profilePublic: isPublic,
        avatarUrl: isPublic ? user.avatarUrl : null,
        emailPreview: maskedEmail(user.email),
        createdAt: user.createdAt
      },
      designs: []
    };

    if (isPublic) {
      const [designs] = await pool.query(
        `SELECT
          ucd.id,
          ucd.title,
          pm.name AS modelName,
          ucd.preview_with_camera_url AS previewWithCameraUrl,
          ucd.payment_status AS paymentStatus,
          ucd.production_status AS productionStatus,
          ucd.executor_photo_url AS executorPhotoUrl,
          ucd.created_at AS createdAt
        FROM user_case_designs ucd
        LEFT JOIN phone_models pm ON pm.id = ucd.phone_model_id
        WHERE ucd.user_id = ?
        ORDER BY ucd.created_at DESC, ucd.id DESC
        LIMIT 30`,
        [id]
      );
      response.designs = designs;
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
});

app.get("/api/profile/designs", requireAuth, async (req, res, next) => {
  try {
    setShortCache(res, 15);
    const [rows] = await pool.query(
      `SELECT
        ucd.id,
        ucd.title,
        ucd.phone_model_id AS phoneModelId,
        pm.name AS modelName,
        ucd.preview_with_camera_url AS previewWithCameraUrl,
        ucd.design_without_camera_url AS designWithoutCameraUrl,
        ucd.payment_status AS paymentStatus,
        ucd.production_status AS productionStatus,
        ucd.executor_photo_url AS executorPhotoUrl,
        ucd.paid_at AS paidAt,
        ucd.shipped_at AS shippedAt,
        ucd.created_at AS createdAt
      FROM user_case_designs ucd
      LEFT JOIN phone_models pm ON pm.id = ucd.phone_model_id
      WHERE ucd.user_id = ?
      ORDER BY ucd.created_at DESC, ucd.id DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/profile/designs/:id", requireAuth, async (req, res, next) => {
  try {
    setShortCache(res, 15);
    const id = Number(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Чехол не найден." });
      return;
    }

    const [rows] = await pool.query(
      `SELECT
        ucd.id,
        ucd.title,
        ucd.phone_model_id AS phoneModelId,
        pm.name AS modelName,
        ucd.preview_with_camera_url AS previewWithCameraUrl,
        ucd.design_without_camera_url AS designWithoutCameraUrl,
        ucd.source_images_json AS sourceImages,
        ucd.design_state_json AS designState,
        ucd.payment_status AS paymentStatus,
        ucd.production_status AS productionStatus,
        ucd.executor_photo_url AS executorPhotoUrl,
        ucd.paid_at AS paidAt,
        ucd.shipped_at AS shippedAt,
        ucd.created_at AS createdAt
      FROM user_case_designs ucd
      LEFT JOIN phone_models pm ON pm.id = ucd.phone_model_id
      WHERE ucd.user_id = ? AND ucd.id = ?
      LIMIT 1`,
      [req.user.id, id]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: "Чехол не найден." });
      return;
    }

    res.json({ design: rows[0] });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/profile/designs", requireAuth, async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body.ids)
      ? req.body.ids.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
      : [];
    const uniqueIds = [...new Set(ids)];

    if (uniqueIds.length === 0) {
      res.status(400).json({ error: "Выберите хотя бы один чехол." });
      return;
    }

    const placeholders = uniqueIds.map(() => "?").join(", ");
    const [result] = await pool.query(
      `DELETE FROM user_case_designs WHERE user_id = ? AND id IN (${placeholders})`,
      [req.user.id, ...uniqueIds]
    );

    res.json({ message: "Выбранные чехлы удалены.", deleted: result.affectedRows });
  } catch (error) {
    next(error);
  }
});

app.post("/api/profile/designs/pay", requireAuth, async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body.ids)
      ? req.body.ids.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
      : [];
    const uniqueIds = [...new Set(ids)];
    const recipient = req.body.recipient && typeof req.body.recipient === "object" ? req.body.recipient : {};
    const recipientName = String(recipient.name || req.user.name || "").trim();
    const recipientPhone = String(recipient.phone || "").trim();
    const recipientEmail = String(recipient.email || req.user.email || "").trim().toLowerCase();
    const city = String(recipient.city || "").trim() || null;
    const address = String(recipient.address || "").trim() || null;
    const postalCode = String(recipient.postalCode || "").trim() || null;
    const customerComment = String(req.body.customerComment || "").trim() || null;
    const termsAccepted = req.body.termsAccepted === true;
    const privacyAccepted = req.body.privacyAccepted === true;
    const legalAcceptedAt = new Date().toISOString();

    if (uniqueIds.length === 0) {
      res.status(400).json({ error: "Выберите хотя бы один дизайн для заказа." });
      return;
    }
    if (!recipientName || !recipientPhone || !recipientEmail || !city || !address) {
      res.status(400).json({ error: "Введите имя, телефон, email, город и адрес доставки." });
      return;
    }
    if (!termsAccepted || !privacyAccepted) {
      res.status(400).json({ error: "Подтвердите согласие с офертой и обработкой персональных данных." });
      return;
    }

    const placeholders = uniqueIds.map(() => "?").join(", ");
    const connection = await pool.getConnection();
    let createdOrder;
    try {
      await connection.beginTransaction();
      const [designs] = await connection.query(
        `SELECT
          ucd.id,
          ucd.user_id,
          ucd.title,
          ucd.phone_model_id,
          ucd.preview_with_camera_url,
          ucd.design_without_camera_url,
          ucd.source_images_json,
          pm.name AS phone_model_name,
          pm.supplier_sku,
          pm.case_material,
          pm.case_color,
          pm.retail_price,
          pm.in_stock,
          pm.is_active
        FROM user_case_designs ucd
        JOIN phone_models pm ON pm.id = ucd.phone_model_id
        WHERE ucd.user_id = ? AND ucd.id IN (${placeholders})
        FOR UPDATE`,
        [req.user.id, ...uniqueIds]
      );

      if (designs.length !== uniqueIds.length) {
        await connection.rollback();
        res.status(400).json({ error: "Один из выбранных дизайнов не найден или не принадлежит вам." });
        return;
      }

      const unavailable = designs.find((design) => !design.is_active || !design.in_stock);
      if (unavailable) {
        await connection.rollback();
        res.status(400).json({ error: `Модель "${unavailable.phone_model_name}" сейчас недоступна для заказа.` });
        return;
      }

      const productsAmount = designs.reduce((sum, design) => sum + toMoney(design.retail_price), 0);
      const deliveryAmount = toMoney(defaultDeliveryAmount);
      const discountAmount = 0;
      const totalAmount = toMoney(productsAmount + deliveryAmount - discountAmount);
      const orderNumber = createOrderNumber();
      const paymentIdempotenceKey = crypto.randomUUID();

      const [orderResult] = await connection.query(
        `INSERT INTO orders
         (order_number, user_id, status, payment_status, payment_provider, payment_idempotence_key,
          products_amount, delivery_amount, discount_amount, total_amount, currency,
          recipient_name, recipient_phone, recipient_email, delivery_method, city, postal_code, address, customer_comment)
         VALUES (?, ?, 'new', 'pending', ?, ?, ?, ?, ?, ?, 'RUB', ?, ?, ?, 'manual', ?, ?, ?, ?)`,
        [
          orderNumber,
          req.user.id,
          paymentTestMode ? "test" : paymentProvider,
          paymentIdempotenceKey,
          productsAmount,
          deliveryAmount,
          discountAmount,
          totalAmount,
          recipientName,
          recipientPhone,
          recipientEmail,
          city,
          postalCode,
          address,
          customerComment
        ]
      );
      const orderId = orderResult.insertId;

      for (const design of designs) {
        const sourceImages = parseJsonValue(design.source_images_json, []);
        const sourceFileUrl = Array.isArray(sourceImages) ? sourceImages.find((item) => item?.sourceUrl)?.sourceUrl || null : null;
        const unitPrice = toMoney(design.retail_price);
        await connection.query(
          `INSERT INTO order_items
           (order_id, design_id, phone_model_id, phone_model_name, supplier_sku, case_material, case_color,
            quantity, unit_price, total_price, source_file_url, preview_file_url, print_file_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
          [
            orderId,
            design.id,
            design.phone_model_id,
            design.phone_model_name,
            design.supplier_sku,
            design.case_material || "TPU",
            design.case_color || "transparent",
            unitPrice,
            unitPrice,
            sourceFileUrl,
            design.preview_with_camera_url,
            design.design_without_camera_url
          ]
        );
      }

      await addOrderHistory(
        connection,
        orderId,
        null,
        "new",
        req.user.id,
        `Заказ создан клиентом. Приняты оферта и политика обработки персональных данных, версия ${legalDocumentVersion}.`
      );
      await connection.commit();
      createdOrder = {
        id: orderId,
        order_number: orderNumber,
        user_id: req.user.id,
        total_amount: totalAmount,
        currency: "RUB",
        payment_idempotence_key: paymentIdempotenceKey,
        legalAcceptedAt
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const payment = await createPaymentForOrder(createdOrder);
    await pool.query(
      `UPDATE orders SET payment_provider = ?, payment_id = ?, payment_idempotence_key = ? WHERE id = ?`,
      [payment.provider, payment.paymentId, payment.idempotenceKey || createdOrder.payment_idempotence_key, createdOrder.id]
    );
    await writeAudit({
      userId: req.user.id,
      action: "order_created",
      entityType: "order",
      entityId: createdOrder.id,
      newData: {
        orderNumber: createdOrder.order_number,
        totalAmount: createdOrder.total_amount,
        paymentProvider: payment.provider,
        legalDocumentVersion,
        legalAcceptedAt: createdOrder.legalAcceptedAt
      },
      req
    });

    res.status(201).json({
      message: "Заказ создан. Перейдите к оплате, чтобы передать его в производство.",
      order: {
        id: createdOrder.id,
        orderNumber: createdOrder.order_number,
        paymentStatus: "pending",
        status: "new",
        totalAmount: createdOrder.total_amount,
        currency: createdOrder.currency
      },
      payment
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/profile/designs", requireAuth, async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim() || `Чехол ${new Date().toLocaleDateString("ru-RU")}`;
    const phoneModelId = Number(req.body.phoneModelId || 0) || null;
    const previewWithCameraUrl = await savePngDataUrl(req.body.previewWithCameraDataUrl, "case-preview");
    const designWithoutCameraUrl = await savePngDataUrl(req.body.designWithoutCameraDataUrl, "case-design");
    const { sourceImagesJson, designStateJson } = await normalizeDesignPayloadAssets(
      req.body.sourceImagesJson,
      req.body.designStateJson
    );

    if (!previewWithCameraUrl || !designWithoutCameraUrl) {
      res.status(400).json({ error: "Не удалось сохранить изображения чехла." });
      return;
    }

    const [result] = await pool.query(
      `INSERT INTO user_case_designs
       (user_id, phone_model_id, title, preview_with_camera_url, design_without_camera_url, source_images_json, design_state_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, phoneModelId, title, previewWithCameraUrl, designWithoutCameraUrl, sourceImagesJson, designStateJson]
    );

    res.status(201).json({
      id: result.insertId,
      title,
      phoneModelId,
      previewWithCameraUrl,
      designWithoutCameraUrl,
      sourceImages: JSON.parse(sourceImagesJson),
      designState: JSON.parse(designStateJson)
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/avatars", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, image_url AS imageUrl, is_active AS isActive, created_at AS createdAt
       FROM avatar_options
       ORDER BY created_at DESC, id DESC`
    );
    res.json(rows.map((row) => ({ ...row, isActive: Boolean(row.isActive) })));
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/avatars", requireAuth, requireAdmin, upload.single("image"), async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const imageUrl = uploadedImageUrl(req.file);

    if (!title || !imageUrl) {
      res.status(400).json({ error: "Введите название и загрузите изображение аватарки." });
      return;
    }

    const [result] = await pool.query(
      "INSERT INTO avatar_options (title, image_url) VALUES (?, ?)",
      [title, imageUrl]
    );

    invalidatePublicData("avatars");
    res.status(201).json({ id: result.insertId, title, imageUrl, isActive: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/avatars/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Аватарка не найдена." });
      return;
    }

    await pool.query("UPDATE avatar_options SET is_active = 0 WHERE id = ?", [id]);
    await pool.query("UPDATE users SET avatar_option_id = NULL WHERE avatar_option_id = ?", [id]);
    invalidatePublicData("avatars");
    res.json({ message: "Аватарка скрыта из доступных вариантов.", id });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/users", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.profile_public AS profilePublic, u.avatar_option_id AS avatarOptionId, ao.image_url AS avatarUrl, u.email_verified_at AS emailVerifiedAt, u.created_at AS createdAt
       FROM users u
       LEFT JOIN avatar_options ao ON ao.id = u.avatar_option_id AND ao.is_active = 1
       ORDER BY u.created_at DESC, u.id DESC`
    );
    res.json(rows.map((row) => ({ ...row, emailVerified: Boolean(row.emailVerifiedAt) })));
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/users/:id/role", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const role = String(req.body.role || "");
    const allowedRoles = new Set(["client", "admin", "executor"]);

    if (!id || !allowedRoles.has(role)) {
      res.status(400).json({ error: "Выберите корректную роль пользователя." });
      return;
    }

    await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    res.json({ message: "Роль пользователя обновлена.", id, role });
  } catch (error) {
    next(error);
  }
});

app.get("/api/profile/orders", requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        o.id,
        o.order_number AS orderNumber,
        o.status,
        o.payment_status AS paymentStatus,
        o.total_amount AS totalAmount,
        o.currency,
        o.tracking_number AS trackingNumber,
        o.created_at AS createdAt,
        o.paid_at AS paidAt,
        o.shipped_at AS shippedAt,
        o.delivered_at AS deliveredAt,
        COUNT(oi.id) AS itemsCount,
        MIN(oi.preview_file_url) AS previewWithCameraUrl,
        GROUP_CONCAT(DISTINCT oi.phone_model_name ORDER BY oi.id SEPARATOR ', ') AS modelName
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC, o.id DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/analytics", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const requestedDays = Number(req.query.days || 30);
    const days = [30, 90, 365].includes(requestedDays) ? requestedDays : 30;
    const paidCondition = "o.payment_status = 'paid' AND o.status <> 'cancelled'";
    const [summaryRows, trendRows, statusRows, modelRows, weekdayRows, funnelRows] = await Promise.all([
      pool.query(
        `SELECT
          SUM(CASE WHEN o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN 1 ELSE 0 END) AS totalOrders,
          SUM(CASE WHEN ${paidCondition} AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN 1 ELSE 0 END) AS paidOrders,
          COALESCE(SUM(CASE WHEN ${paidCondition} AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN o.total_amount ELSE 0 END), 0) AS revenue,
          SUM(CASE WHEN o.status = 'delivered' AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN 1 ELSE 0 END) AS deliveredOrders,
          COALESCE(SUM(CASE WHEN ${paidCondition} AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN o.total_amount ELSE 0 END), 0) AS currentRevenue,
          COALESCE(SUM(CASE WHEN ${paidCondition} AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND o.created_at < DATE_SUB(NOW(), INTERVAL ? DAY) THEN o.total_amount ELSE 0 END), 0) AS previousRevenue,
          SUM(CASE WHEN ${paidCondition} AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN 1 ELSE 0 END) AS currentPaidOrders,
          SUM(CASE WHEN ${paidCondition} AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND o.created_at < DATE_SUB(NOW(), INTERVAL ? DAY) THEN 1 ELSE 0 END) AS previousPaidOrders
         FROM orders o
         WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [days, days, days, days, days, days, days * 2, days, days, days * 2, days * 2]
      ),
      pool.query(
        `SELECT
          DATE_FORMAT(o.created_at, '%Y-%m-%d') AS date,
          COUNT(*) AS totalOrders,
          SUM(CASE WHEN ${paidCondition} THEN 1 ELSE 0 END) AS paidOrders,
          COALESCE(SUM(CASE WHEN ${paidCondition} THEN o.total_amount ELSE 0 END), 0) AS revenue
         FROM orders o
         WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         GROUP BY DATE(o.created_at)
         ORDER BY DATE(o.created_at)`,
        [days - 1]
      ),
      pool.query(
        `SELECT o.status AS status, COUNT(*) AS count
         FROM orders o
         WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY o.status`,
        [days]
      ),
      pool.query(
        `SELECT COALESCE(NULLIF(oi.phone_model_name, ''), 'Без модели') AS name, COUNT(*) AS count
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND ${paidCondition}
         GROUP BY COALESCE(NULLIF(oi.phone_model_name, ''), 'Без модели')
         ORDER BY count DESC, name ASC
         LIMIT 6`,
        [days]
      ),
      pool.query(
        `SELECT WEEKDAY(o.created_at) AS weekday, COUNT(*) AS count
         FROM orders o
         WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND ${paidCondition}
         GROUP BY WEEKDAY(o.created_at)
         ORDER BY weekday`,
        [days]
      ),
      pool.query(
        `SELECT
          COUNT(*) AS created,
          SUM(CASE WHEN ${paidCondition} THEN 1 ELSE 0 END) AS paid,
          SUM(CASE WHEN o.status IN ('in_production', 'ready', 'shipped', 'delivered') AND o.payment_status = 'paid' THEN 1 ELSE 0 END) AS production,
          SUM(CASE WHEN o.status IN ('shipped', 'delivered') THEN 1 ELSE 0 END) AS shipped,
          SUM(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END) AS delivered
         FROM orders o
         WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [days]
      )
    ]);

    const summary = summaryRows[0][0] || {};
    res.json({
      days,
      summary,
      trend: trendRows[0],
      statuses: statusRows[0],
      models: modelRows[0],
      weekdays: weekdayRows[0],
      funnel: funnelRows[0][0] || {}
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/orders", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const userId = Number(req.query.userId || 0);
    const phoneModelId = Number(req.query.phoneModelId || 0);
    const sortDirection = String(req.query.sort || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";
    const conditions = [];
    const params = [];

    if (userId) {
      conditions.push("o.user_id = ?");
      params.push(userId);
    }
    if (phoneModelId) {
      conditions.push("EXISTS (SELECT 1 FROM order_items filter_item WHERE filter_item.order_id = o.id AND filter_item.phone_model_id = ?)");
      params.push(phoneModelId);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await pool.query(
      `SELECT
        o.id,
        o.order_number AS orderNumber,
        o.user_id AS userId,
        u.name AS customerName,
        u.email AS customerEmail,
        o.status,
        o.payment_status AS paymentStatus,
        o.payment_provider AS paymentProvider,
        o.total_amount AS totalAmount,
        o.currency,
        o.recipient_name AS recipientName,
        o.recipient_phone AS recipientPhone,
        o.recipient_email AS recipientEmail,
        o.city,
        o.address,
        o.tracking_number AS trackingNumber,
        o.assigned_executor_id AS assignedExecutorId,
        ex.name AS assignedExecutorName,
        o.created_at AS createdAt,
        o.paid_at AS paidAt,
        o.shipped_at AS shippedAt,
        o.delivered_at AS deliveredAt,
        COUNT(oi.id) AS itemsCount,
        MIN(oi.preview_file_url) AS previewWithCameraUrl,
        MAX(oi.executor_photo_url) AS executorPhotoUrl,
        GROUP_CONCAT(DISTINCT oi.phone_model_name ORDER BY oi.id SEPARATOR ', ') AS modelName
      FROM orders o
      JOIN users u ON u.id = o.user_id
      LEFT JOIN users ex ON ex.id = o.assigned_executor_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      ${where}
      GROUP BY o.id
      ORDER BY o.created_at ${sortDirection}, o.id ${sortDirection}`,
      params
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/orders/:id/status", requireAuth, requireAdmin, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const id = Number(req.params.id);
    const status = String(req.body.status || "");
    const trackingNumber = String(req.body.trackingNumber || "").trim() || null;
    const allowedStatuses = new Set(["in_production", "ready", "shipped", "delivered", "cancelled"]);

    if (!id || !allowedStatuses.has(status)) {
      res.status(400).json({ error: "Выберите корректный статус заказа." });
      return;
    }

    await connection.beginTransaction();
    const [rows] = await connection.query("SELECT id, status, payment_status FROM orders WHERE id = ? FOR UPDATE", [id]);
    if (!rows.length) {
      await connection.rollback();
      res.status(404).json({ error: "Заказ не найден." });
      return;
    }
    const order = rows[0];
    if (order.payment_status !== "paid" && status !== "cancelled") {
      await connection.rollback();
      res.status(400).json({ error: "Нельзя передать в работу неоплаченный заказ." });
      return;
    }
    if (!canTransitionOrder(order.status, status)) {
      await connection.rollback();
      res.status(400).json({ error: `Переход статуса ${order.status} -> ${status} запрещен.` });
      return;
    }

    const fields = ["status = ?"];
    const values = [status];
    if (status === "in_production") fields.push("production_started_at = COALESCE(production_started_at, CURRENT_TIMESTAMP)");
    if (status === "shipped") {
      fields.push("shipped_at = COALESCE(shipped_at, CURRENT_TIMESTAMP)");
      if (trackingNumber) {
        fields.push("tracking_number = ?");
        values.push(trackingNumber);
      }
    }
    if (status === "delivered") fields.push("delivered_at = COALESCE(delivered_at, CURRENT_TIMESTAMP)");
    if (status === "cancelled") fields.push("cancelled_at = COALESCE(cancelled_at, CURRENT_TIMESTAMP)", "payment_status = IF(payment_status = 'pending', 'cancelled', payment_status)");
    values.push(id);
    await connection.query(`UPDATE orders SET ${fields.join(", ")} WHERE id = ?`, values);
    await addOrderHistory(connection, id, order.status, status, req.user.id, req.body.comment || null);
    await connection.commit();
    await writeAudit({ userId: req.user.id, action: "order_status_changed", entityType: "order", entityId: id, oldData: { status: order.status }, newData: { status, trackingNumber }, req });
    res.json({ message: "Статус заказа обновлен.", id, status });
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/orders/:id/assign", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const executorId = Number(req.body.executorId || 0);
    if (!id || !executorId) {
      res.status(400).json({ error: "Выберите заказ и исполнителя." });
      return;
    }
    const [executors] = await pool.query("SELECT id FROM users WHERE id = ? AND role IN ('executor', 'admin')", [executorId]);
    if (!executors.length) {
      res.status(400).json({ error: "Исполнитель не найден." });
      return;
    }
    const [result] = await pool.query(
      "UPDATE orders SET assigned_executor_id = ? WHERE id = ? AND payment_status = 'paid'",
      [executorId, id]
    );
    if (result.affectedRows === 0) {
      res.status(400).json({ error: "Назначать исполнителя можно только на оплаченный заказ." });
      return;
    }
    await writeAudit({ userId: req.user.id, action: "order_executor_assigned", entityType: "order", entityId: id, newData: { executorId }, req });
    res.json({ message: "Исполнитель назначен.", id, executorId });
  } catch (error) {
    next(error);
  }
});

app.get("/api/executor/orders", requireAuth, requireExecutor, async (req, res, next) => {
  try {
    const params = [];
    const executorCondition = req.user.role === "admin" ? "" : "AND o.assigned_executor_id = ?";
    if (req.user.role !== "admin") params.push(req.user.id);
    const [rows] = await pool.query(
      `SELECT
        o.id,
        o.order_number AS orderNumber,
        o.status,
        o.payment_status AS paymentStatus,
        o.recipient_name AS recipientName,
        o.city,
        o.address,
        o.tracking_number AS trackingNumber,
        o.paid_at AS paidAt,
        o.shipped_at AS shippedAt,
        o.delivered_at AS deliveredAt,
        u.id AS customerId,
        u.name AS customerName,
        u.email AS customerEmail,
        COUNT(oi.id) AS itemsCount,
        MIN(oi.preview_file_url) AS previewWithCameraUrl,
        MIN(oi.print_file_url) AS designWithoutCameraUrl,
        MAX(oi.executor_photo_url) AS executorPhotoUrl,
        GROUP_CONCAT(DISTINCT oi.phone_model_name ORDER BY oi.id SEPARATOR ', ') AS modelName
      FROM orders o
      JOIN users u ON u.id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.payment_status = 'paid' AND o.status IN ('paid', 'in_production', 'ready') ${executorCondition}
      GROUP BY o.id
      ORDER BY
        FIELD(o.status, 'paid', 'in_production', 'ready', 'shipped', 'delivered', 'cancelled'),
        o.paid_at DESC,
        o.id DESC`,
      params
    );
    res.json(rows.map((row) => ({
      ...row,
      productionStatus: row.status === "paid" ? "in_work" : row.status
    })));
  } catch (error) {
    next(error);
  }
});

app.post("/api/executor/orders/:id/photo", requireAuth, requireExecutor, upload.single("finalPhoto"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const photoUrl = uploadedImageUrl(req.file);
    const executorCondition = req.user.role === "admin" ? "" : "AND assigned_executor_id = ?";
    const params = req.user.role === "admin" ? [id] : [id, req.user.id];
    if (!id || !photoUrl) {
      res.status(400).json({ error: "Прикрепите фото готового чехла." });
      return;
    }
    const [allowed] = await pool.query(`SELECT id, status FROM orders WHERE id = ? AND payment_status = 'paid' AND status IN ('paid', 'in_production') ${executorCondition}`, params);
    if (!allowed.length) {
      res.status(403).json({ error: "Этот заказ вам не назначен." });
      return;
    }
    await pool.query(
      `UPDATE order_items SET executor_photo_url = ?, production_status = 'done'
       WHERE order_id = ?`,
      [photoUrl, id]
    );
    const [remaining] = await pool.query("SELECT COUNT(*) AS count FROM order_items WHERE order_id = ? AND executor_photo_url IS NULL", [id]);
    const nextStatus = Number(remaining[0].count) === 0 ? "ready" : "in_production";
    await pool.query(
      "UPDATE orders SET status = ?, production_started_at = IF(? = 'in_production', COALESCE(production_started_at, CURRENT_TIMESTAMP), production_started_at) WHERE id = ?",
      [nextStatus, nextStatus, id]
    );
    await writeAudit({ userId: req.user.id, action: "executor_photo_uploaded", entityType: "order", entityId: id, newData: { photoUrl }, req });
    res.json({ message: "Фото готового чехла прикреплено.", executorPhotoUrl: photoUrl });
  } catch (error) {
    next(error);
  }
});

app.post("/api/executor/orders/:id/ship", requireAuth, requireExecutor, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const id = Number(req.params.id);
    const executorCondition = req.user.role === "admin" ? "" : "AND assigned_executor_id = ?";
    const params = req.user.role === "admin" ? [id] : [id, req.user.id];
    if (!id) {
      res.status(400).json({ error: "Заказ не найден." });
      return;
    }
    await connection.beginTransaction();
    const [orders] = await connection.query(`SELECT id, status FROM orders WHERE id = ? AND payment_status = 'paid' AND status = 'ready' ${executorCondition} FOR UPDATE`, params);
    if (!orders.length) {
      await connection.rollback();
      res.status(403).json({ error: "Этот заказ вам не назначен." });
      return;
    }
    const [photos] = await connection.query("SELECT COUNT(*) AS missing FROM order_items WHERE order_id = ? AND executor_photo_url IS NULL", [id]);
    if (Number(photos[0].missing) > 0) {
      await connection.rollback();
      res.status(400).json({ error: "Перед отправкой нужно прикрепить фото готового чехла." });
      return;
    }
    await connection.query("UPDATE orders SET status = 'shipped', shipped_at = COALESCE(shipped_at, CURRENT_TIMESTAMP) WHERE id = ?", [id]);
    await addOrderHistory(connection, id, orders[0].status, "shipped", req.user.id, "Исполнитель отметил заказ отправленным.");
    await connection.commit();
    await writeAudit({ userId: req.user.id, action: "order_shipped_by_executor", entityType: "order", entityId: id, req });
    res.json({ message: "Заказ отмечен как отправленный." });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

app.get("/api/phone-model-categories", async (_req, res, next) => {
  try {
    setPublicCache(res, 60);
    res.json(await listCachedCategories("phone-model-categories", "phone_model_categories", "phone_models"));
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/phone-model-categories", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    res.setHeader("Cache-Control", "private, no-store");
    res.json(await listCachedCategories("phone-model-categories", "phone_model_categories", "phone_models", true));
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/phone-model-categories", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const payload = readCategoryPayload(req.body);
    if (!payload) {
      res.status(400).json({ error: "Введите название категории моделей." });
      return;
    }
    const category = await createCategory("phone_model_categories", payload);
    invalidatePublicData("phone-model-categories");
    await writeAudit({ userId: req.user.id, action: "phone_model_category_created", entityType: "phone_model_category", entityId: category.id, newData: category, req });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/phone-model-categories/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const payload = readCategoryPayload(req.body);
    if (!id || !payload) {
      res.status(400).json({ error: "Введите корректные данные категории моделей." });
      return;
    }
    const category = await updateCategory("phone_model_categories", id, payload);
    if (!category) {
      res.status(404).json({ error: "Категория моделей не найдена." });
      return;
    }
    invalidatePublicData("phone-model-categories", "models");
    await writeAudit({ userId: req.user.id, action: "phone_model_category_updated", entityType: "phone_model_category", entityId: id, newData: category, req });
    res.json(category);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/phone-model-categories/:id", requireAuth, requireAdmin, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const id = Number(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Категория моделей не найдена." });
      return;
    }
    await connection.beginTransaction();
    const [categories] = await connection.query("SELECT id, name FROM phone_model_categories WHERE id = ? FOR UPDATE", [id]);
    if (!categories.length) {
      await connection.rollback();
      res.status(404).json({ error: "Категория моделей не найдена." });
      return;
    }
    await connection.query("UPDATE phone_models SET category_id = NULL WHERE category_id = ?", [id]);
    await connection.query("DELETE FROM phone_model_categories WHERE id = ?", [id]);
    await connection.commit();
    invalidatePublicData("phone-model-categories", "models");
    await writeAudit({ userId: req.user.id, action: "phone_model_category_deleted", entityType: "phone_model_category", entityId: id, oldData: categories[0], req });
    res.json({ message: "Категория моделей удалена. Модели перенесены в список без категории.", id });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

async function loadModelCatalog() {
  const [rows] = await pool.query(
    `SELECT pm.id, pm.category_id AS categoryId, pmc.name AS categoryName, pmc.slug AS categorySlug, pm.name, pm.slug, pm.manufacturer, pm.supplier_sku AS supplierSku, pm.case_material AS caseMaterial, pm.case_color AS caseColor, pm.retail_price AS retailPrice, pm.old_price AS oldPrice, pm.production_days AS productionDays, pm.camera_type AS cameraType, pm.case_width AS caseWidth, pm.case_height AS caseHeight, pm.corner_radius AS cornerRadius, pm.frame_width AS frameWidth, pm.color, pm.logo, pm.phone_image_url AS phoneImageUrl, pm.camera_image_url AS cameraImageUrl, pm.camera_mask_url AS cameraMaskUrl, pm.camera_work_url AS cameraWorkUrl, pm.camera_editor_state AS cameraEditorState, pm.camera_offset_x AS cameraOffsetX, pm.camera_offset_y AS cameraOffsetY, pm.camera_scale AS cameraScale, pm.in_stock AS inStock
     FROM phone_models pm
     LEFT JOIN phone_model_categories pmc ON pmc.id = pm.category_id
     WHERE pm.is_active = 1
     ORDER BY COALESCE(pmc.sort_order, 1000), pm.sort_order, pm.name`
  );
  return rows;
}

async function listModelsRoute(req, res, next, { privateResponse = false } = {}) {
  try {
    if (privateResponse) res.setHeader("Cache-Control", "private, no-store");
    else setPublicCache(res, 60);
    const categoryId = Number(req.query.category_id || 0);
    const categorySlug = String(req.query.category_slug || "").trim().toLowerCase();
    const search = String(req.query.search || "").trim().toLowerCase().slice(0, 100);
    const rows = await getCachedPublicData("models", loadModelCatalog);
    const filteredRows = rows.filter((row) => {
      if (categoryId && Number(row.categoryId) !== categoryId) return false;
      if (categorySlug && String(row.categorySlug || "").toLowerCase() !== categorySlug) return false;
      if (search && !String(row.name || "").toLowerCase().includes(search)) return false;
      return true;
    });
    res.json(filteredRows);
  } catch (error) {
    next(error);
  }
}

app.get("/api/models", listModelsRoute);
app.get("/api/phone-models", listModelsRoute);
app.get("/api/admin/models", requireAuth, requireAdmin, (req, res, next) => {
  listModelsRoute(req, res, next, { privateResponse: true });
});

app.get("/api/template-categories", async (_req, res, next) => {
  try {
    setPublicCache(res, 60);
    res.json(await listCachedCategories("template-categories", "design_template_categories", "case_templates"));
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/template-categories", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    res.setHeader("Cache-Control", "private, no-store");
    res.json(await listCachedCategories("template-categories", "design_template_categories", "case_templates", true));
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/template-categories", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const payload = readCategoryPayload(req.body);
    if (!payload) {
      res.status(400).json({ error: "Введите название категории макетов." });
      return;
    }
    const category = await createCategory("design_template_categories", payload);
    invalidatePublicData("template-categories");
    await writeAudit({ userId: req.user.id, action: "template_category_created", entityType: "template_category", entityId: category.id, newData: category, req });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/template-categories/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const payload = readCategoryPayload(req.body);
    if (!id || !payload) {
      res.status(400).json({ error: "Введите корректные данные категории макетов." });
      return;
    }
    const category = await updateCategory("design_template_categories", id, payload);
    if (!category) {
      res.status(404).json({ error: "Категория макетов не найдена." });
      return;
    }
    invalidatePublicData("template-categories", "templates");
    await writeAudit({ userId: req.user.id, action: "template_category_updated", entityType: "template_category", entityId: id, newData: category, req });
    res.json(category);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/template-categories/:id", requireAuth, requireAdmin, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const id = Number(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Категория макетов не найдена." });
      return;
    }
    await connection.beginTransaction();
    const [categories] = await connection.query("SELECT id, name FROM design_template_categories WHERE id = ? FOR UPDATE", [id]);
    if (!categories.length) {
      await connection.rollback();
      res.status(404).json({ error: "Категория макетов не найдена." });
      return;
    }
    await connection.query("UPDATE case_templates SET category_id = NULL WHERE category_id = ?", [id]);
    await connection.query("DELETE FROM design_template_categories WHERE id = ?", [id]);
    await connection.commit();
    invalidatePublicData("template-categories", "templates");
    await writeAudit({ userId: req.user.id, action: "template_category_deleted", entityType: "template_category", entityId: id, oldData: categories[0], req });
    res.json({ message: "Категория макетов удалена. Макеты перенесены в список без категории.", id });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

app.get("/api/sticker-categories", async (_req, res, next) => {
  try {
    setPublicCache(res, 60);
    res.json(await listCachedCategories("sticker-categories", "sticker_categories", "stickers"));
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/sticker-categories", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    res.setHeader("Cache-Control", "private, no-store");
    res.json(await listCachedCategories("sticker-categories", "sticker_categories", "stickers", true));
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/sticker-categories", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const payload = readCategoryPayload(req.body);
    if (!payload) {
      res.status(400).json({ error: "Введите название категории стикеров." });
      return;
    }
    const category = await createCategory("sticker_categories", payload);
    invalidatePublicData("sticker-categories");
    await writeAudit({ userId: req.user.id, action: "sticker_category_created", entityType: "sticker_category", entityId: category.id, newData: category, req });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/sticker-categories/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const payload = readCategoryPayload(req.body);
    if (!id || !payload) {
      res.status(400).json({ error: "Введите корректные данные категории стикеров." });
      return;
    }
    const category = await updateCategory("sticker_categories", id, payload);
    if (!category) {
      res.status(404).json({ error: "Категория стикеров не найдена." });
      return;
    }
    invalidatePublicData("sticker-categories", "stickers");
    await writeAudit({ userId: req.user.id, action: "sticker_category_updated", entityType: "sticker_category", entityId: id, newData: category, req });
    res.json(category);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/sticker-categories/:id", requireAuth, requireAdmin, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const id = Number(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Категория стикеров не найдена." });
      return;
    }
    await connection.beginTransaction();
    const [categories] = await connection.query("SELECT id, name FROM sticker_categories WHERE id = ? FOR UPDATE", [id]);
    if (!categories.length) {
      await connection.rollback();
      res.status(404).json({ error: "Категория стикеров не найдена." });
      return;
    }
    await connection.query("UPDATE stickers SET category_id = NULL WHERE category_id = ?", [id]);
    await connection.query("DELETE FROM sticker_categories WHERE id = ?", [id]);
    await connection.commit();
    invalidatePublicData("sticker-categories", "stickers");
    await writeAudit({ userId: req.user.id, action: "sticker_category_deleted", entityType: "sticker_category", entityId: id, oldData: categories[0], req });
    res.json({ message: "Категория стикеров удалена. Стикеры остались без категории.", id });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

async function loadStickerCatalog() {
  const [rows] = await pool.query(`
    SELECT
      s.id,
      s.title,
      s.category_id AS categoryId,
      sc.name AS categoryName,
      sc.slug AS categorySlug,
      sc.is_active AS categoryIsActive,
      s.image_url AS imageUrl,
      s.sort_order AS sortOrder,
      s.created_at AS createdAt
    FROM stickers s
    LEFT JOIN sticker_categories sc ON sc.id = s.category_id
    WHERE s.is_active = 1
    ORDER BY COALESCE(sc.sort_order, 1000), s.sort_order, s.title, s.id
  `);
  return rows;
}

function filterStickerCatalog(rows, req, { publicOnly = false } = {}) {
  const categoryId = Number(req.query.category_id || 0);
  const categorySlug = String(req.query.category_slug || "").trim().toLowerCase();
  return rows.filter((row) => {
    if (publicOnly && (!row.categoryId || !row.categoryIsActive)) return false;
    if (categoryId && Number(row.categoryId) !== categoryId) return false;
    if (categorySlug && String(row.categorySlug || "").toLowerCase() !== categorySlug) return false;
    return true;
  });
}

app.get("/api/stickers", async (req, res, next) => {
  try {
    setPublicCache(res, 60);
    const rows = await getCachedPublicData("stickers", loadStickerCatalog);
    res.json(filterStickerCatalog(rows, req, { publicOnly: true }));
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/stickers", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    res.setHeader("Cache-Control", "private, no-store");
    res.json(filterStickerCatalog(await loadStickerCatalog(), req));
  } catch (error) {
    next(error);
  }
});

async function loadTemplateCatalog() {
  const [rows] = await pool.query(`
      SELECT
        ct.id,
        ct.title,
        ct.category_id AS categoryId,
        dtc.name AS categoryName,
        dtc.slug AS categorySlug,
        ct.image_url AS imageUrl,
        COALESCE(ct.preview_url, ct.image_url) AS previewUrl,
        ct.template_data AS templateData,
        ct.phone_model_id AS phoneModelId,
        pm.name AS modelName,
        ct.created_at AS createdAt
      FROM case_templates ct
      LEFT JOIN phone_models pm ON pm.id = ct.phone_model_id
      LEFT JOIN design_template_categories dtc ON dtc.id = ct.category_id
      WHERE ct.is_active = 1
      ORDER BY COALESCE(dtc.sort_order, 1000), ct.created_at DESC, ct.id DESC
    `);
  return rows;
}

app.get("/api/templates", async (req, res, next) => {
  try {
    setPublicCache(res, 60);
    const categoryId = Number(req.query.category_id || 0);
    const categorySlug = String(req.query.category_slug || "").trim().toLowerCase();
    const rows = await getCachedPublicData("templates", loadTemplateCatalog);
    res.json(rows.filter((row) => {
      if (categoryId && Number(row.categoryId) !== categoryId) return false;
      if (categorySlug && String(row.categorySlug || "").toLowerCase() !== categorySlug) return false;
      return true;
    }));
  } catch (error) {
    next(error);
  }
});

function readModelPayload(body) {
  const name = String(body.name || "").trim();
  const cameraType = String(body.cameraType || "uploaded").trim();
  const caseWidth = Number(body.caseWidth || 330);
  const caseHeight = Number(body.caseHeight || 690);
  const cornerRadius = Number(body.cornerRadius ?? 46);
  const frameWidth = Number(body.frameWidth ?? 18);
  const color = String(body.color || "#d9e5f5").trim();
  const logo = body.logo || null;
  const cameraOffsetX = Number(body.cameraOffsetX || 0);
  const cameraOffsetY = Number(body.cameraOffsetY || 0);
  const cameraScale = Number(body.cameraScale || 1);
  const categoryId = Number(body.categoryId || body.category_id || 0) || null;
  const inStock = body.inStock === "1" || body.inStock === "true" || body.inStock === true || body.inStock === 1;

  if (
    !name ||
    !Number.isFinite(caseWidth) ||
    !Number.isFinite(caseHeight) ||
    !Number.isFinite(cornerRadius) ||
    !Number.isFinite(frameWidth) ||
    !Number.isFinite(cameraOffsetX) ||
    !Number.isFinite(cameraOffsetY) ||
    !Number.isFinite(cameraScale) ||
    caseWidth < 180 ||
    caseHeight < 320 ||
    cornerRadius < 0 ||
    frameWidth < 0 ||
    frameWidth > 18 ||
    cameraScale < 0.4 ||
    cameraScale > 2.5
  ) {
    return null;
  }

  return {
    name,
    cameraType,
    caseWidth: Math.round(caseWidth),
    caseHeight: Math.round(caseHeight),
    cornerRadius: Math.round(cornerRadius),
    frameWidth: Math.round(frameWidth),
    color,
    logo,
    cameraOffsetX: Math.round(cameraOffsetX),
    cameraOffsetY: Math.round(cameraOffsetY),
    cameraScale: Number(cameraScale.toFixed(2)),
    categoryId,
    inStock
  };
}

app.post("/api/admin/models", requireAuth, requireAdmin, modelUpload, async (req, res, next) => {
  try {
    const payload = readModelPayload(req.body);
    const phoneFile = req.files?.phoneImage?.[0];
    const cameraFile = req.files?.cameraImage?.[0];

    if (!payload) {
      res.status(400).json({ error: "Заполните название модели и загрузите изображения." });
      return;
    }
    const cameraMaskUrl = await saveMaskDataUrl(req.body.cameraMaskDataUrl);
    const cameraWorkUrl = (await savePngDataUrl(req.body.cameraWorkDataUrl, "camera-work")) || cameraMaskUrl;
    const cameraEditorState = normalizeEditorState(req.body.cameraEditorState);
    const phoneImageUrl = uploadedImageUrl(phoneFile);
    const cameraImageUrl = uploadedImageUrl(cameraFile) || phoneImageUrl;
    if (!phoneImageUrl || !cameraImageUrl || !cameraMaskUrl) {
      res.status(400).json({ error: "Загрузите фото модели и обработайте камеры ластиком." });
      return;
    }
    const baseSlug = slugify(payload.name);
    const slug = `${baseSlug || "model"}-${Date.now()}`;
    const [maxRows] = await pool.query("SELECT COALESCE(MAX(sort_order), 0) + 10 AS nextSort FROM phone_models");
    const [result] = await pool.query(
      "INSERT INTO phone_models (category_id, name, slug, camera_type, case_width, case_height, corner_radius, frame_width, color, logo, phone_image_url, camera_image_url, camera_mask_url, camera_work_url, camera_editor_state, camera_offset_x, camera_offset_y, camera_scale, in_stock, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [payload.categoryId, payload.name, slug, payload.cameraType, payload.caseWidth, payload.caseHeight, payload.cornerRadius, payload.frameWidth, payload.color, payload.logo, phoneImageUrl, cameraImageUrl, cameraMaskUrl, cameraWorkUrl, cameraEditorState, payload.cameraOffsetX, payload.cameraOffsetY, payload.cameraScale, payload.inStock ? 1 : 0, Number(maxRows[0].nextSort)]
    );

    invalidatePublicData("models", "phone-model-categories");
    res.status(201).json({
      id: result.insertId,
      categoryId: payload.categoryId,
      name: payload.name,
      slug,
      cameraType: payload.cameraType,
      caseWidth: payload.caseWidth,
      caseHeight: payload.caseHeight,
      cornerRadius: payload.cornerRadius,
      frameWidth: payload.frameWidth,
      color: payload.color,
      logo: payload.logo,
      phoneImageUrl,
      cameraImageUrl,
      cameraMaskUrl,
      cameraWorkUrl,
      cameraEditorState: JSON.parse(cameraEditorState),
      cameraOffsetX: payload.cameraOffsetX,
      cameraOffsetY: payload.cameraOffsetY,
      cameraScale: payload.cameraScale,
      inStock: payload.inStock
    });
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/models/:id", requireAuth, requireAdmin, modelUpload, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const payload = readModelPayload(req.body);

    if (!id || !payload) {
      res.status(400).json({ error: "Заполните название модели и загрузите изображения." });
      return;
    }

    const [currentRows] = await pool.query("SELECT phone_image_url, camera_image_url, camera_mask_url, camera_work_url, camera_editor_state FROM phone_models WHERE id = ? AND is_active = 1", [id]);
    if (currentRows.length === 0) {
      res.status(404).json({ error: "Модель не найдена." });
      return;
    }

    const uploadedPhoneFile = req.files?.phoneImage?.[0];
    const uploadedCameraFile = req.files?.cameraImage?.[0];
    const usePhoneImageForCamera = String(req.body.usePhoneImageForCamera || "") === "1";
    const verifiedPhoneImageUrl = uploadedImageUrl(uploadedPhoneFile);
    const verifiedCameraImageUrl = uploadedImageUrl(uploadedCameraFile);
    const phoneImageUrl = verifiedPhoneImageUrl || currentRows[0].phone_image_url;
    const cameraImageUrl = verifiedCameraImageUrl || (verifiedPhoneImageUrl ? phoneImageUrl : currentRows[0].camera_image_url || phoneImageUrl);
    const newCameraMaskUrl = await saveMaskDataUrl(req.body.cameraMaskDataUrl);
    const newCameraWorkUrl = await savePngDataUrl(req.body.cameraWorkDataUrl, "camera-work");
    if ((uploadedCameraFile || uploadedPhoneFile || usePhoneImageForCamera) && !newCameraMaskUrl) {
      res.status(400).json({ error: "После замены фото камер нужно снова обработать его ластиком." });
      return;
    }
    const cameraMaskUrl = newCameraMaskUrl || currentRows[0].camera_mask_url;
    const cameraWorkUrl = newCameraWorkUrl || currentRows[0].camera_work_url || cameraMaskUrl;
    const cameraEditorState = req.body.cameraEditorState ? normalizeEditorState(req.body.cameraEditorState) : currentRows[0].camera_editor_state || "{}";
    if ((uploadedPhoneFile && !verifiedPhoneImageUrl) || (uploadedCameraFile && !verifiedCameraImageUrl)) {
      res.status(400).json({ error: "Для модели телефона нужны файлы изображений." });
      return;
    }

    const [result] = await pool.query(
      `UPDATE phone_models
       SET category_id = ?, name = ?, camera_type = ?, case_width = ?, case_height = ?, corner_radius = ?, frame_width = ?, color = ?, logo = ?, phone_image_url = ?, camera_image_url = ?, camera_mask_url = ?, camera_work_url = ?, camera_editor_state = ?, camera_offset_x = ?, camera_offset_y = ?, camera_scale = ?, in_stock = ?
       WHERE id = ? AND is_active = 1`,
      [payload.categoryId, payload.name, payload.cameraType, payload.caseWidth, payload.caseHeight, payload.cornerRadius, payload.frameWidth, payload.color, payload.logo, phoneImageUrl, cameraImageUrl, cameraMaskUrl, cameraWorkUrl, cameraEditorState, payload.cameraOffsetX, payload.cameraOffsetY, payload.cameraScale, payload.inStock ? 1 : 0, id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Модель не найдена." });
      return;
    }

    invalidatePublicData("models", "templates", "phone-model-categories");
    res.json({ id, ...payload, phoneImageUrl, cameraImageUrl, cameraMaskUrl, cameraWorkUrl, cameraEditorState: JSON.parse(cameraEditorState) });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/models/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Модель не найдена." });
      return;
    }

    const [result] = await pool.query("UPDATE phone_models SET is_active = 0 WHERE id = ? AND is_active = 1", [id]);
    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Модель не найдена." });
      return;
    }

    await pool.query("UPDATE case_templates SET phone_model_id = NULL WHERE phone_model_id = ?", [id]);
    invalidatePublicData("models", "templates", "phone-model-categories");
    res.json({ message: "Модель удалена." });
  } catch (error) {
    next(error);
  }
});

app.post("/api/payments/yookassa/webhook", async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const payload = req.body || {};
    const eventType = String(payload.event || payload.type || "");
    const object = payload.object || {};
    const paymentId = String(object.id || "");
    const eventId = String(payload.id || `${eventType}:${paymentId}:${object.status || ""}`);

    if (!eventType || !paymentId) {
      res.status(400).json({ error: "Invalid YooKassa webhook payload." });
      return;
    }

    await connection.beginTransaction();
    try {
      await connection.query(
        `INSERT INTO payment_events (provider, external_event_id, external_payment_id, event_type, payload)
         VALUES ('yookassa', ?, ?, ?, ?)`,
        [eventId, paymentId, eventType, JSON.stringify(payload)]
      );
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        await connection.rollback();
        res.json({ ok: true, duplicate: true });
        return;
      }
      throw error;
    }

    const [orders] = await connection.query("SELECT * FROM orders WHERE payment_provider = 'yookassa' AND payment_id = ? FOR UPDATE", [paymentId]);
    if (!orders.length) {
      await connection.query("UPDATE payment_events SET processed_at = CURRENT_TIMESTAMP WHERE provider = 'yookassa' AND external_event_id = ?", [eventId]);
      await connection.commit();
      res.json({ ok: true, ignored: true });
      return;
    }

    const order = orders[0];
    const paidAmount = toMoney(object.amount?.value);
    const paidCurrency = String(object.amount?.currency || order.currency || "RUB").toUpperCase();
    const isSucceeded = eventType === "payment.succeeded" || object.status === "succeeded";

    if (isSucceeded && paidAmount === toMoney(order.total_amount) && paidCurrency === String(order.currency).toUpperCase()) {
      if (order.payment_status !== "paid") {
        await connection.query(
          `UPDATE orders
           SET payment_status = 'paid',
               status = 'paid',
               paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP)
           WHERE id = ?`,
          [order.id]
        );
        await addOrderHistory(connection, order.id, order.status, "paid", null, "Оплата подтверждена webhook YooKassa.");
      }
    } else if (eventType === "payment.canceled" || object.status === "canceled") {
      await connection.query(
        `UPDATE orders SET payment_status = 'cancelled', status = 'cancelled', cancelled_at = COALESCE(cancelled_at, CURRENT_TIMESTAMP)
         WHERE id = ? AND payment_status <> 'paid'`,
        [order.id]
      );
      await addOrderHistory(connection, order.id, order.status, "cancelled", null, "Платеж отменен YooKassa.");
    } else if (isSucceeded) {
      await connection.query("UPDATE orders SET payment_status = 'failed' WHERE id = ? AND payment_status <> 'paid'", [order.id]);
      await addOrderHistory(connection, order.id, order.status, order.status, null, "Webhook отклонен: сумма или валюта не совпали.");
    }

    await connection.query("UPDATE payment_events SET processed_at = CURRENT_TIMESTAMP WHERE provider = 'yookassa' AND external_event_id = ?", [eventId]);
    await connection.commit();
    await writeAudit({ action: "payment_webhook_processed", entityType: "order", entityId: order.id, newData: { eventType, paymentId } });
    res.json({ ok: true });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

app.post("/api/admin/templates", requireAuth, requireAdmin, upload.single("image"), async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const categoryId = Number(req.body.categoryId || req.body.category_id || 0) || null;

    if (!title) {
      res.status(400).json({ error: "Введите название макета." });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "Прикрепите изображение макета." });
      return;
    }

    const imageUrl = uploadedImageUrl(req.file);
    if (!imageUrl) {
      res.status(400).json({ error: "Файл макета не является корректным изображением." });
      return;
    }
    const templateData = await normalizeTemplateDataPayload(req.body.templateData || req.body.template_data || null);
    const [result] = await pool.query(
      "INSERT INTO case_templates (category_id, phone_model_id, title, image_url, preview_url, template_data, original_filename, mime_type, file_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [categoryId, null, title, imageUrl, imageUrl, templateData, req.file.originalname, req.file.mimetype, req.file.size]
    );

    invalidatePublicData("templates", "template-categories");
    res.status(201).json({
      id: result.insertId,
      title,
      categoryId,
      imageUrl,
      previewUrl: imageUrl,
      templateData: parseJsonValue(templateData, null),
      phoneModelId: null,
      modelName: null
    });
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/templates/:id", requireAuth, requireAdmin, upload.single("image"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const title = String(req.body.title || "").trim();
    const categoryId = Number(req.body.categoryId || req.body.category_id || 0) || null;

    if (!id || !title) {
      res.status(400).json({ error: "Введите название макета." });
      return;
    }
    const templateData = await normalizeTemplateDataPayload(req.body.templateData || req.body.template_data || null);

    if (req.file) {
      const imageUrl = uploadedImageUrl(req.file);
      if (!imageUrl) {
        res.status(400).json({ error: "Файл макета не является корректным изображением." });
        return;
      }
      const [result] = await pool.query(
        `UPDATE case_templates
         SET title = ?, category_id = ?, phone_model_id = ?, image_url = ?, preview_url = ?, template_data = COALESCE(?, template_data), original_filename = ?, mime_type = ?, file_size = ?
         WHERE id = ? AND is_active = 1`,
        [title, categoryId, null, imageUrl, imageUrl, templateData, req.file.originalname, req.file.mimetype, req.file.size, id]
      );
      if (result.affectedRows === 0) {
        res.status(404).json({ error: "Макет не найден." });
        return;
      }
      invalidatePublicData("templates", "template-categories");
      res.json({ id, title, categoryId, imageUrl, previewUrl: imageUrl, templateData: parseJsonValue(templateData, null), phoneModelId: null, modelName: null });
      return;
    }

    const [result] = await pool.query(
      "UPDATE case_templates SET title = ?, category_id = ?, phone_model_id = ?, template_data = COALESCE(?, template_data) WHERE id = ? AND is_active = 1",
      [title, categoryId, null, templateData, id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Макет не найден." });
      return;
    }

    invalidatePublicData("templates", "template-categories");
    res.json({ id, title, categoryId, templateData: parseJsonValue(templateData, null), phoneModelId: null, modelName: null });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/templates/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Макет не найден." });
      return;
    }
    const [rows] = await pool.query(
      `SELECT id, title, category_id AS categoryId, phone_model_id AS phoneModelId, image_url AS imageUrl,
              COALESCE(preview_url, image_url) AS previewUrl, template_data AS templateData,
              is_active AS isActive, created_at AS createdAt
       FROM case_templates
       WHERE id = ?
       LIMIT 1`,
      [id]
    );
    if (!rows.length) {
      res.status(404).json({ error: "Макет не найден." });
      return;
    }
    res.json({ ...rows[0], isActive: Boolean(rows[0].isActive) });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/templates/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Макет не найден." });
      return;
    }

    const [result] = await pool.query("UPDATE case_templates SET is_active = 0 WHERE id = ? AND is_active = 1", [id]);
    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Макет не найден." });
      return;
    }

    invalidatePublicData("templates", "template-categories");
    res.json({ message: "Макет удален." });
  } catch (error) {
    next(error);
  }
});

function readStickerPayload(body) {
  const title = String(body.title || "").trim();
  const categoryId = Number(body.categoryId || body.category_id || 0) || null;
  if (!title || title.length > 160) return null;
  return { title, categoryId };
}

async function stickerCategoryIsValid(categoryId) {
  if (!categoryId) return true;
  const [rows] = await pool.query("SELECT id FROM sticker_categories WHERE id = ? AND is_active = 1 LIMIT 1", [categoryId]);
  return rows.length > 0;
}

async function nextStickerSortOrder(categoryId) {
  const [rows] = await pool.query(
    "SELECT COALESCE(MAX(sort_order), 0) + 1 AS nextSortOrder FROM stickers WHERE category_id <=> ?",
    [categoryId]
  );
  return Number(rows[0]?.nextSortOrder || 1);
}

app.post("/api/admin/stickers", requireAuth, requireAdmin, upload.single("image"), async (req, res, next) => {
  let keepUploadedFile = false;
  try {
    const payload = readStickerPayload(req.body);
    if (!payload) {
      removeUploadedFile(req.file);
      res.status(400).json({ error: "Введите название стикера." });
      return;
    }
    if (!await stickerCategoryIsValid(payload.categoryId)) {
      removeUploadedFile(req.file);
      res.status(400).json({ error: "Выберите существующую категорию стикеров." });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "Загрузите PNG или WEBP с прозрачным фоном." });
      return;
    }
    const imageUrl = uploadedStickerImageUrl(req.file);
    if (!imageUrl) {
      res.status(400).json({ error: "Стикер должен быть корректным PNG или WEBP изображением." });
      return;
    }
    const sortOrder = await nextStickerSortOrder(payload.categoryId);
    const [result] = await pool.query(
      "INSERT INTO stickers (category_id, title, image_url, original_filename, mime_type, file_size, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [payload.categoryId, payload.title, imageUrl, req.file.originalname, req.file.mimetype, req.file.size, sortOrder]
    );
    const sticker = { id: result.insertId, ...payload, imageUrl, sortOrder };
    keepUploadedFile = true;
    invalidatePublicData("stickers", "sticker-categories");
    await writeAudit({ userId: req.user.id, action: "sticker_created", entityType: "sticker", entityId: sticker.id, newData: sticker, req });
    res.status(201).json(sticker);
  } catch (error) {
    if (!keepUploadedFile) removeUploadedFile(req.file);
    next(error);
  }
});

app.put("/api/admin/stickers/:id", requireAuth, requireAdmin, upload.single("image"), async (req, res, next) => {
  let keepUploadedFile = false;
  try {
    const id = Number(req.params.id);
    const payload = readStickerPayload(req.body);
    if (!id || !payload) {
      removeUploadedFile(req.file);
      res.status(400).json({ error: "Введите корректные данные стикера." });
      return;
    }
    if (!await stickerCategoryIsValid(payload.categoryId)) {
      removeUploadedFile(req.file);
      res.status(400).json({ error: "Выберите существующую категорию стикеров." });
      return;
    }

    const [existingRows] = await pool.query(
      "SELECT category_id AS categoryId, sort_order AS sortOrder FROM stickers WHERE id = ? AND is_active = 1 LIMIT 1",
      [id]
    );
    if (!existingRows.length) {
      removeUploadedFile(req.file);
      res.status(404).json({ error: "Стикер не найден." });
      return;
    }
    const existingSticker = existingRows[0];
    const sortOrder = String(existingSticker.categoryId || "") === String(payload.categoryId || "")
      ? Number(existingSticker.sortOrder || 1)
      : await nextStickerSortOrder(payload.categoryId);

    let imageUrl = null;
    if (req.file) {
      imageUrl = uploadedStickerImageUrl(req.file);
      if (!imageUrl) {
        res.status(400).json({ error: "Стикер должен быть корректным PNG или WEBP изображением." });
        return;
      }
      await pool.query(
        "UPDATE stickers SET category_id = ?, title = ?, image_url = ?, original_filename = ?, mime_type = ?, file_size = ?, sort_order = ? WHERE id = ? AND is_active = 1",
        [payload.categoryId, payload.title, imageUrl, req.file.originalname, req.file.mimetype, req.file.size, sortOrder, id]
      );
    } else {
      await pool.query(
        "UPDATE stickers SET category_id = ?, title = ?, sort_order = ? WHERE id = ? AND is_active = 1",
        [payload.categoryId, payload.title, sortOrder, id]
      );
    }
    keepUploadedFile = Boolean(req.file);
    const sticker = { id, ...payload, sortOrder, ...(imageUrl ? { imageUrl } : {}) };
    invalidatePublicData("stickers", "sticker-categories");
    await writeAudit({ userId: req.user.id, action: "sticker_updated", entityType: "sticker", entityId: id, newData: sticker, req });
    res.json(sticker);
  } catch (error) {
    if (!keepUploadedFile) removeUploadedFile(req.file);
    next(error);
  }
});

app.delete("/api/admin/stickers/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Стикер не найден." });
      return;
    }
    const [rows] = await pool.query("SELECT id, title, image_url AS imageUrl FROM stickers WHERE id = ? AND is_active = 1", [id]);
    if (!rows.length) {
      res.status(404).json({ error: "Стикер не найден." });
      return;
    }
    await pool.query("UPDATE stickers SET is_active = 0 WHERE id = ?", [id]);
    invalidatePublicData("stickers", "sticker-categories");
    await writeAudit({ userId: req.user.id, action: "sticker_deleted", entityType: "sticker", entityId: id, oldData: rows[0], req });
    res.json({ message: "Стикер удалён.", id });
  } catch (error) {
    next(error);
  }
});

app.use(apiPrefix, (_req, res) => {
  res.status(404).json({ error: "API-маршрут не найден." });
});

app.use((_req, res) => {
  res.status(404);
  sendProjectFile(res, "error.html", { cache: "no-store" });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: "Файл слишком большой. Загрузите изображение до 8 МБ.",
      LIMIT_FIELD_VALUE: "Макет слишком большой. Уменьшите изображение или количество слоев."
    };
    res.status(400).json({ error: messages[error.code] || error.message || "Не удалось загрузить файл." });
    return;
  }
  if (["ECONNREFUSED", "ETIMEDOUT", "ECONNRESET"].includes(error.code)) {
    res.status(503).json({
      error: "Временная ошибка подключения к внешнему сервису. Повторите запрос позже."
    });
    return;
  }
  res.status(500).json({ error: error.message || "Внутренняя ошибка сервера." });
});

function startServer(currentPort, attemptsLeft = 5) {
  const server = app.listen(currentPort, host, () => {
    console.log(`Case editor is running locally: http://localhost:${currentPort}`);
    console.log(`Listening on: ${host}:${currentPort}`);
    console.log(`Configured public URL: ${appUrl}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && attemptsLeft > 0) {
      const nextPort = currentPort + 1;
      console.log(`Port ${currentPort} is busy, trying ${nextPort}...`);
      server.close(() => startServer(nextPort, attemptsLeft - 1));
      return;
    }
    throw error;
  });
}

startServer(port);
