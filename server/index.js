import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import dotenv from "dotenv";

const ROOT_DIR = path.resolve(process.cwd());
const ENV_FILES = [".env.local", ".env"];

for (const file of ENV_FILES) {
  const fullPath = path.join(ROOT_DIR, file);
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath, override: false });
  }
}

const XPYUN_PRINT_URL = "https://open.xpyun.net/api/openapi/xprinter/print";
const XPYUN_ADD_PRINTERS_URL = "https://open.xpyun.net/api/openapi/xprinter/addPrinters";
const PORT = Number(process.env.XPYUN_PROXY_PORT || 8787);

function readConfig() {
  return {
    user: String(process.env.XPYUN_USER || process.env.VITE_XPYUN_USER || "").trim(),
    userKey: String(process.env.XPYUN_USER_KEY || process.env.VITE_XPYUN_USER_KEY || "").trim(),
    sn: String(process.env.XPYUN_PRINTER_SN || process.env.VITE_XPYUN_PRINTER_SN || "").trim(),
    copies: Number(process.env.XPYUN_COPIES || process.env.VITE_XPYUN_COPIES || 1),
    cutter: Number(process.env.XPYUN_CUTTER || process.env.VITE_XPYUN_CUTTER || 0),
    voice: Number(process.env.XPYUN_VOICE || process.env.VITE_XPYUN_VOICE || 2),
    mode: Number(process.env.XPYUN_MODE || process.env.VITE_XPYUN_MODE || 1)
  };
}

function sha1(text) {
  return crypto.createHash("sha1").update(String(text || "")).digest("hex");
}

function createError(message, status = 400, raw = null) {
  const error = new Error(message);
  error.status = status;
  error.raw = raw;
  return error;
}

function ensureUserConfig(config) {
  if (config.user && config.userKey) {
    return;
  }
  throw createError("芯烨云账号未配置，请设置 XPYUN_USER、XPYUN_USER_KEY", 500);
}

function ensurePrinterConfig(config) {
  ensureUserConfig(config);
  if (config.sn) {
    return;
  }
  throw createError("芯烨云打印机 SN 未配置，请设置 XPYUN_PRINTER_SN", 500);
}

function normalizeItems(items = []) {
  if (!Array.isArray(items) || !items.length) {
    throw createError("请至少提供一台打印机");
  }
  if (items.length > 50) {
    throw createError("每次最多添加50台打印机");
  }

  return items.map((item, index) => {
    const sn = String(item?.sn || "").trim();
    const name = String(item?.name || "").trim();
    if (!sn || !name) {
      throw createError(`第${index + 1}台打印机缺少 sn 或 name`);
    }
    return { sn, name };
  });
}

async function requestXpyun(url, payload, config) {
  const timestamp = `${Math.floor(Date.now() / 1000)}`;
  const sign = sha1(`${config.user}${config.userKey}${timestamp}`);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8"
    },
    body: JSON.stringify({
      user: config.user,
      timestamp,
      sign,
      debug: "0",
      ...payload
    })
  });

  let result = null;
  try {
    result = await response.json();
  } catch (error) {
    result = null;
  }

  if (response.status < 200 || response.status >= 300) {
    throw createError(`芯烨云请求失败(${response.status})`, response.status, result);
  }

  const code = Number(result?.code ?? result?.error ?? 0);
  if (code !== 0) {
    throw createError(result?.msg || result?.message || "芯烨云请求失败", 400, result);
  }

  return result;
}

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/api/xpyun/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/xpyun/add-printers", async (req, res) => {
  try {
    const config = readConfig();
    ensureUserConfig(config);
    const data = await requestXpyun(XPYUN_ADD_PRINTERS_URL, {
      items: normalizeItems(req.body?.items)
    }, config);
    res.json({ ok: true, data });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      message: error.message || "添加打印机失败",
      raw: error.raw || null
    });
  }
});

app.post("/api/xpyun/ensure-printer-bound", async (req, res) => {
  try {
    const config = readConfig();
    ensurePrinterConfig(config);
    const shopName = String(req.body?.shopName || "").trim();
    const name = String(req.body?.name || `${shopName || "农友收银打印机"}-${config.sn.slice(-4)}`).slice(0, 50);
    const data = await requestXpyun(XPYUN_ADD_PRINTERS_URL, {
      items: [{ sn: config.sn, name }]
    }, config);
    res.json({ ok: true, data, sn: config.sn, name });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      message: error.message || "自动绑定打印机失败",
      raw: error.raw || null
    });
  }
});

app.post("/api/xpyun/print", async (req, res) => {
  try {
    const config = readConfig();
    ensurePrinterConfig(config);
    const data = await requestXpyun(XPYUN_PRINT_URL, {
      sn: config.sn,
      content: String(req.body?.content || "").trim(),
      copies: Number(req.body?.copies ?? config.copies),
      cutter: Number(req.body?.cutter ?? config.cutter),
      voice: Number(req.body?.voice ?? config.voice),
      mode: Number(req.body?.mode ?? config.mode),
      idempotent: String(req.body?.idempotent || `print_${Date.now()}`).slice(0, 50)
    }, config);
    res.json({ ok: true, data });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      message: error.message || "打印失败",
      raw: error.raw || null
    });
  }
});

app.listen(PORT, () => {
  console.log(`XPYUN proxy listening on http://127.0.0.1:${PORT}`);
});
