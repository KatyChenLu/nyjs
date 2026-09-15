const XPYUN_PROXY_BASE = String(import.meta.env.VITE_XPYUN_PROXY_BASE || "/api/xpyun").trim();
const XPYUN_BIND_CACHE_KEY = "ny_xpyun_bound_printers";

function readConfig() {
  return {
    enabled: String(import.meta.env.VITE_XPYUN_ENABLED || "1").trim() !== "0",
    sn: String(import.meta.env.VITE_XPYUN_PRINTER_SN || "").trim(),
    copies: Number(import.meta.env.VITE_XPYUN_COPIES || 1),
    cutter: Number(import.meta.env.VITE_XPYUN_CUTTER || 0),
    voice: Number(import.meta.env.VITE_XPYUN_VOICE || 2),
    mode: Number(import.meta.env.VITE_XPYUN_MODE || 1)
  };
}

function createXpyunError(message, raw = null) {
  const error = new Error(message || "打印失败");
  error.raw = raw;
  return error;
}

function byteLengthOfChar(char) {
  return /[^\x00-\xff]/.test(char) ? 2 : 1;
}

function sliceByDisplayWidth(text, maxWidth) {
  const source = String(text || "");
  let width = 0;
  let output = "";
  for (const char of source) {
    const charWidth = byteLengthOfChar(char);
    if (width + charWidth > maxWidth) {
      break;
    }
    output += char;
    width += charWidth;
  }
  return output;
}

function padRight(text, width) {
  const value = sliceByDisplayWidth(text, width);
  const currentWidth = Array.from(value).reduce((sum, char) => sum + byteLengthOfChar(char), 0);
  return `${value}${" ".repeat(Math.max(width - currentWidth, 0))}`;
}

function formatMoney(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

function buildReceiptContent(payload = {}) {
  const lines = Array.isArray(payload.lines) ? payload.lines : [];
  const totals = Array.isArray(payload.totals) ? payload.totals : [];
  const divider = "--------------------------------";
  const content = [
    "<CB>汇泽农业收银小票<BR><BR><BR></CB>",
    `门店：${payload.shopName || "当前门店"}`,
    `时间：${payload.time || ""}`,
    `单号：${payload.orderSn || "-"}`,
    `收银员：${payload.cashierName || "-"}`,
    divider,
    `${padRight("商品", 12)}${padRight("数量", 6)}${padRight("单价", 6)}${padRight("小计", 8)}`,
    divider
  ];

  lines.forEach((item) => {
    const name = String(item.name || "商品");
    const qty = String(item.qty || "0");
    const price = formatMoney(item.price);
    const amount = formatMoney(item.amount);

    content.push(sliceByDisplayWidth(name, 32));
    content.push(`${padRight("", 2)}${padRight(qty, 4)}${padRight(price, 10)}${padRight(amount, 10)}`);
  });

  if (totals.length) {
    content.push(divider);
    totals.forEach((item) => {
      content.push(`${item.label || "-"}：${item.value || "-"}`);
    });
  }

  if (payload.memberMobile) {
    content.push(`会员：${payload.memberMobile}`);
  }

  content.push(divider);
  content.push(payload.footer || "感谢惠顾，欢迎下次光临");
  content.push("<CUT>");

  return content.join("\n");
}

function readBindCache() {
  try {
    const raw = window.localStorage.getItem(XPYUN_BIND_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function writeBindCache(cache) {
  window.localStorage.setItem(XPYUN_BIND_CACHE_KEY, JSON.stringify(cache));
}

async function requestProxy(path, body) {
  const response = await fetch(`${XPYUN_PROXY_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8"
    },
    body: JSON.stringify(body || {})
  });

  let result = null;
  try {
    result = await response.json();
  } catch (error) {
    result = null;
  }

  if (response.status < 200 || response.status >= 300) {
    throw createXpyunError(result?.message || result?.msg || `打印代理请求失败(${response.status})`, result);
  }

  if (result?.ok === false) {
    throw createXpyunError(result?.message || "打印代理请求失败", result);
  }

  return result?.data ?? result;
}

export function isXpyunConfigured() {
  return readConfig().enabled;
}

export async function addXpyunPrinters(items = [], options = {}) {
  return requestProxy("/add-printers", {
    items,
    printerNamePrefix: options.printerNamePrefix || ""
  });
}

export async function ensureCurrentXpyunPrinterBound(userinfo = {}, options = {}) {
  const config = readConfig();
  const cacheKey = `${String(userinfo?.id || "")}__${config.sn || "default"}`;
  const cache = readBindCache();
  if (cache[cacheKey]) {
    return { skipped: true, reason: "already_bound" };
  }

  const result = await requestProxy("/ensure-printer-bound", {
    shopName: String(userinfo?.shopname || "").trim(),
    name: String(options.name || "").trim()
  });

  cache[cacheKey] = {
    sn: result?.sn || config.sn || "",
    boundAt: Date.now()
  };
  writeBindCache(cache);

  return result;
}

export async function printXpyunReceipt(payload = {}, options = {}) {
  const config = { ...readConfig(), ...options };
  return requestProxy("/print", {
    content: buildReceiptContent(payload),
    copies: config.copies,
    cutter: config.cutter,
    voice: config.voice,
    mode: config.mode,
    idempotent: String(options.idempotent || payload.orderSn || `history_${Date.now()}`).slice(0, 50)
  });
}
