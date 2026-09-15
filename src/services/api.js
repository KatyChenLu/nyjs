import { ref } from "vue";

const STORAGE_KEYS = {
  token: "ny_cashier_shop_token",
  user: "ny_cashier_shop_user",
  baseUrl: "ny_cashier_api_base_url",
  pickupOrders: "ny_cashier_pickup_orders",
  saler: "ny_cashier_saler"
};

const DEFAULT_BASE_URL = "https://www.hznongye.com";

function parseCachedSaler() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.saler);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

// 响应式缓存：让依赖 getCachedSaler 的 computed 在登录/退出后自动刷新
const cachedSaler = ref(parseCachedSaler());

function getEnvBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || "";
}

function normalizeBaseUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function getBaseUrl() {
  const cached = window.localStorage.getItem(STORAGE_KEYS.baseUrl);
  return normalizeBaseUrl(cached || getEnvBaseUrl() || DEFAULT_BASE_URL);
}

function joinUrl(path = "") {
  if (!path) {
    return getBaseUrl();
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  if (String(path).startsWith("//")) {
    return `https:${path}`;
  }
  return `${getBaseUrl()}/${String(path).replace(/^\/+/, "")}`;
}

function createApiError(message, code = 0, raw = null) {
  const error = new Error(message || "请求失败");
  error.code = code;
  error.raw = raw;
  return error;
}

function normalizeApiResponse(payload, status) {
  if (status < 200 || status >= 300) {
    throw createApiError(`请求失败(${status})`, status, payload);
  }
  if (payload && typeof payload === "object" && Object.prototype.hasOwnProperty.call(payload, "code")) {
    if (Number(payload.code) !== 1) {
      throw createApiError(payload.msg || "请求失败", Number(payload.code || 0), payload);
    }
    return payload.data;
  }
  return payload;
}

async function request({ url, method = "POST", data, auth = true }) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = authStore.getToken();
    if (token) {
      headers.token = token;
    }
  }

  const response = await fetch(joinUrl(url), {
    method,
    headers,
    body: method === "GET" ? undefined : JSON.stringify(data || {})
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  return normalizeApiResponse(payload, response.status);
}

function splitList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeCategoryText(item)).filter(Boolean);
  }
  return String(value || "")
    .split(",")
    .map((item) => normalizeCategoryText(item))
    .filter(Boolean);
}

function normalizeCategoryText(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toNumber(value, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function buildPlaceholderDataUri(label = "商品") {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f7f0df"/>
          <stop offset="100%" stop-color="#efe3bf"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" rx="32" fill="#f8fafc"/>
      <rect x="56" y="64" width="128" height="132" rx="18" fill="url(#g)" stroke="#d8c59c" stroke-width="4"/>
      <path d="M74 86L166 86" stroke="#d8c59c" stroke-width="8" stroke-linecap="round"/>
      <path d="M90 60L90 98M120 50L120 102M150 60L150 98" stroke="#50637d" stroke-width="10" stroke-linecap="round"/>
      <text x="120" y="220" text-anchor="middle" font-size="24" fill="#526277" font-family="Microsoft YaHei, sans-serif">${label}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function formatMoney(value) {
  return toNumber(value).toFixed(2);
}

export function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value || "");
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function getErrorMessage(error, fallback = "操作失败") {
  return String(error?.message || fallback);
}

function normalizeGoods(item = {}) {
  const typeIds = splitList(item.typeId).map((value) => toNumber(value)).filter(Boolean);
  const typeNames = splitList(item.typeName);
  const originalPrice = toNumber(item.salePrice);
  const activityPrice = toNumber(item.price ?? item.activePrice ?? item.salePrice);

  return {
    id: toNumber(item.id),
    goodsName: item.goodsName || "未命名商品",
    barcode: String(item.barcode || ""),
    spec: item.spec || "-",
    originalPrice,
    activityPrice,
    salePrice: activityPrice,
    stock: toNumber(item.stock),
    shopStock: toNumber(item.nums),
    typeIds,
    typeNames,
    typeText: typeNames.join(" / "),
    label: item.label || "",
    rate: toNumber(item.rate, 100),
    image: item.mainImage ? joinUrl(item.mainImage) : buildPlaceholderDataUri("农资")
  };
}

function normalizeGoodsPage(result = {}) {
  const rawList = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
  return {
    total: toNumber(result?.total, rawList.length),
    page: toNumber(result?.current_page, 1),
    pageSize: toNumber(result?.per_page, rawList.length || 15),
    lastPage: toNumber(result?.last_page, 1),
    list: rawList.map(normalizeGoods)
  };
}

function buildCategoryList(payload = [], goodsList = []) {
  const all = payload.map((item) => ({
    id: toNumber(item?.id ?? item?.value ?? item?.typeId),
    name: normalizeCategoryText(item?.name || item?.label || item?.title || item?.text),
    pid: toNumber(item?.pid ?? 0),
    level: toNumber(item?.level ?? 1),
    spacer: String(item?.spacer || ""),
    haschild: toNumber(item?.haschild ?? 0)
  })).filter((item) => item.id || item.name);

  // 从商品中补充分类
  goodsList.forEach((goods) => {
    goods.typeNames.forEach((name, index) => {
      const id = goods.typeIds[index];
      if (id && !all.some((c) => c.id === id)) {
        all.push({ id, name: normalizeCategoryText(name), pid: 0, level: 1, spacer: "", haschild: 0 });
      }
    });
  });

  // 构建层级树结构
  const childrenMap = new Map();
  const rootItems = [];

  all.forEach((item) => {
    const children = childrenMap.get(item.pid) || [];
    children.push(item);
    childrenMap.set(item.pid, children);
  });

  // 递归构建带层级信息的列表
  function flattenTree(pid, depth) {
    const items = childrenMap.get(pid) || [];
    const result = [];
    items.forEach((item) => {
      result.push({ ...item, depth });
      if (item.haschild || childrenMap.has(item.id)) {
        result.push(...flattenTree(item.id, depth + 1));
      }
    });
    return result;
  }

  const tree = flattenTree(0, 0);

  // 始终添加"全部"
  const hasAll = tree.some((item) => item.id === 0);
  if (!hasAll) {
    tree.unshift({ id: 0, name: "全部", pid: 0, level: 0, spacer: "", haschild: 0, depth: 0 });
  }

  return tree;
}

function normalizeMember(item = {}) {
  return {
    id: toNumber(item.id),
    username: item.username || `会员${item.id || ""}`,
    mobile: String(item.mobile || ""),
    money: toNumber(item.money),
    level: toNumber(item.level),
    rate: toNumber(item.rate, 100)
  };
}

function normalizeUser(userinfo = {}) {
  return {
    id: toNumber(userinfo.id),
    shopname: userinfo.shopname || "汇泽农业收银系统",
    contact: userinfo.contact || "",
    mobile: String(userinfo.mobile || ""),
    address: userinfo.address || "",
    salesAmount: formatMoney(userinfo.salesAmount),
    status: toNumber(userinfo.status),
    token: userinfo.token || ""
  };
}

function normalizePickupOrder(order = {}) {
  const goodsList = Array.isArray(order.items)
    ? order.items
    : Array.isArray(order.goods)
      ? order.goods
      : Array.isArray(order.detail)
        ? order.detail
      : Array.isArray(order.lines)
        ? order.lines
        : [];
  const items = goodsList.length
    ? goodsList.map((item) => ({
        id: toNumber(item.id ?? item.goodsId),
        goodsName: item.goodsName || item.name || "商品名称",
        price: toNumber(item.price ?? item.salePrice),
        discount: toNumber(item.discount ?? item.discountAmount ?? item.discountPrice),
        qty: toNumber(item.qty ?? item.nums, 1),
        subtotal: toNumber(item.subtotal ?? item.amount ?? item.goodsPrice)
      }))
    : [];

  const statusValue = Number(order.status);
  const statusText = String(order.status_text || order.statusText || "");
  const isDone = order.status === "done"
    || /已自提|已完成|已签收|已核销/.test(statusText)
    || statusValue === 3
    || statusValue === 4;
  const status = isDone ? "done" : "pending";
  const totalAmount = toNumber(order.totalAmount ?? order.amount ?? order.saleAmount ?? order.goodsPrice);
  const discountAmount = toNumber(order.discountAmount ?? order.discount ?? order.couponPrice);
  const roundPrice = toNumber(order.roundPrice ?? order.round_amount ?? order.eraseAmount);
  const payableAmount = toNumber(order.payableAmount ?? order.payAmount ?? order.actualAmount ?? order.saleAmount);
  const actualAmount = toNumber(order.actualAmount ?? order.payAmount ?? order.payableAmount);
  const payLabel = order.payLabel || order.payType_text || ({ 1: "微信/支付宝", 2: "余额", 3: "现金" }[toNumber(order.payType)] || "未知");
  const aerialInfo = order.aerialInfo && typeof order.aerialInfo === "object" ? order.aerialInfo : null;

  return {
    id: String(order.id || order.orderId || ""),
    orderSn: String(order.orderSn || order.order_sn || order.id || ""),
    pickupCode: String(order.pickupCode || order.pickup_code || order.orderSn || order.order_sn || ""),
    orderType: toNumber(order.orderType ?? order.order_type, 0),
    status,
    statusText: statusText || (status === "done" ? "已自提" : "待自提"),
    payLabel,
    memberName: order.memberName || order.username || order.receiver || "散客",
    memberMobile: String(order.memberMobile || order.mobile || order.phone || ""),
    shopName: order.shopName || order.shopname || order.storeName || "当前门店",
    createdAt: order.createdAt || order.createtime || order.createTime || "",
    pickupAt: order.pickupAt || order.shippingtime || order.pickupTime || "",
    actualPickupAt: order.actualPickupAt || order.receivetime || order.pickupFinishTime || "",
    totalAmount,
    discountAmount,
    roundPrice,
    payableAmount,
    actualAmount,
    aerialPrice: toNumber(order.aerialPrice ?? aerialInfo?.amount ?? aerialInfo?.price),
    aerialStatusText: order.aerialStatus_text || aerialInfo?.status_text || "",
    aerialAppointAt: aerialInfo?.appointtime || "",
    aerialPilotName: aerialInfo?.username || "",
    aerialPilotMobile: aerialInfo?.mobile || "",
    items,
    itemCount: items.reduce((sum, item) => sum + item.qty, 0)
  };
}

function filterPickupOrderByDate(order, filters) {
  const start = filters.startDate ? `${filters.startDate} 00:00:00` : "";
  const end = filters.endDate ? `${filters.endDate} 23:59:59` : "";
  if (start && order.createdAt < start) {
    return false;
  }
  if (end && order.createdAt > end) {
    return false;
  }
  return true;
}

export const authStore = {
  getToken() {
    return window.localStorage.getItem(STORAGE_KEYS.token) || "";
  },
  hasToken() {
    return Boolean(this.getToken());
  },
  getCachedUser() {
    const raw = window.localStorage.getItem(STORAGE_KEYS.user);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  },
  saveSession(userinfo = {}) {
    const user = { ...(this.getCachedUser() || {}), ...normalizeUser(userinfo) };
    if (user.token) {
      window.localStorage.setItem(STORAGE_KEYS.token, user.token);
    }
    window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    return user;
  },
  clearSession() {
    window.localStorage.removeItem(STORAGE_KEYS.token);
    window.localStorage.removeItem(STORAGE_KEYS.user);
  },
  getCachedSaler() {
    return cachedSaler.value;
  },
  saveSaler(saler = {}) {
    const current = cachedSaler.value || {};
    const next = { ...current, ...saler };
    window.localStorage.setItem(STORAGE_KEYS.saler, JSON.stringify(next));
    cachedSaler.value = next;
    return next;
  },
  clearSaler() {
    window.localStorage.removeItem(STORAGE_KEYS.saler);
    cachedSaler.value = null;
  },
  setBaseUrl(url) {
    const normalized = normalizeBaseUrl(url);
    if (!normalized) {
      window.localStorage.removeItem(STORAGE_KEYS.baseUrl);
      return;
    }
    window.localStorage.setItem(STORAGE_KEYS.baseUrl, normalized);
  },
  getBaseUrl
};

const shopApi = {
  loginWithPassword(payload) {
    return request({ url: "shop/user/login", auth: false, data: payload });
  },
  sendSms(payload) {
    return request({ url: "shop/sms/send", auth: false, data: payload });
  },
  fetchTypeSelect(payload = {}) {
    return request({ url: "shop/index/typeSelect", data: payload });
  },
  fetchGoodsList(payload = {}) {
    return request({
      url: "shop/index/goodsList",
      data: { typeId: 0, keyword: "", page: 1, ...payload }
    });
  },
  fetchSalerList(payload = {}) {
    return request({ url: "shop/index/getSalerList", data: payload });
  },
  salerLogin(payload = {}) {
    return request({ url: "shop/index/salerLogin", auth: true, data: payload });
  },
  fetchMemberReport(payload = {}) {
    return request({ url: "shop/index/memberReport", data: payload });
  },
  exportMemberReport(payload = {}) {
    return request({ url: "shop/index/memberReportExport", data: payload });
  },
  fetchGoodsByBarcode(barcode) {
    return request({ url: "shop/index/getGoodsByBarcode", data: { barcode: String(barcode || "") } });
  },
  fetchUserByMobile(mobile) {
    return request({ url: "shop/index/getUserByMobile", data: { mobile: String(mobile || "") } });
  },
  recharge(payload) {
    return request({ url: "shop/index/recharge", data: payload });
  },
  fetchRoundRate() {
    return request({ url: "shop/index/getRoundRate", data: {} });
  },
  settlement(payload) {
    return request({ url: "shop/index/settlement", data: payload });
  },
  verifyPayPassword(payload) {
    return request({ url: "shop/index/verifyPayPassword", data: payload });
  },
  print(payload) {
    return request({ url: "shop/index/print", data: payload });
  },
  fetchOrderList(payload = {}) {
    return request({ url: "shop/index/orderList", data: payload });
  },
  fetchOrderDetail(payload) {
    return request({ url: "shop/index/orderDetail", data: payload });
  },
  pickUp(payload) {
    return request({ url: "shop/index/pickUp", data: payload });
  },
  searchGoods(payload) {
    return request({ url: "shop/index/searchGoods", data: payload });
  },
  fetchMoneyLog(payload = {}) {
    return request({ url: "shop/index/moneyLog", data: payload });
  },
  goodsApply(payload) {
    return request({ url: "shop/index/goodsApply", data: payload });
  },
  completeApply(payload) {
    return request({ url: "shop/index/completeApply", data: payload });
  },
  fetchApplyList(payload = {}) {
    return request({ url: "shop/index/applyList", data: payload });
  }
};

export const api = {
  async login(payload) {
    const result = await shopApi.loginWithPassword(payload);
    return authStore.saveSession(result?.userinfo || {});
  },
  async sendSms(payload) {
    return shopApi.sendSms(payload);
  },
  async fetchCatalog(payload = {}) {
    const [typeResult, goodsResult] = await Promise.allSettled([
      shopApi.fetchTypeSelect({}),
      shopApi.fetchGoodsList(payload)
    ]);

    const goodsPage = goodsResult.status === "fulfilled"
      ? normalizeGoodsPage(goodsResult.value)
      : { total: 0, page: 1, pageSize: 15, lastPage: 1, list: [] };

    const categories = buildCategoryList(
      typeResult.status === "fulfilled"
        ? Array.isArray(typeResult.value?.data)
          ? typeResult.value.data
          : Array.isArray(typeResult.value)
            ? typeResult.value
            : Array.isArray(typeResult.value?.list)
              ? typeResult.value.list
              : []
        : [],
      goodsPage.list
    );

    return { categories, goodsPage };
  },
  async fetchGoods(payload = {}) {
    return normalizeGoodsPage(await shopApi.fetchGoodsList(payload));
  },
  async searchGoods(keyword) {
    return normalizeGoodsPage(await shopApi.searchGoods({ keyword: String(keyword || "").trim() }));
  },
  async fetchGoodsByBarcode(barcode) {
    return normalizeGoods(await shopApi.fetchGoodsByBarcode(barcode));
  },
  async searchMembers(mobile) {
    const result = await shopApi.fetchUserByMobile(mobile);
    return Array.isArray(result) ? result.map(normalizeMember) : [];
  },
  async rechargeMember(payload) {
    await shopApi.recharge(payload);
    return true;
  },
  async fetchRoundRate() {
    const result = await shopApi.fetchRoundRate();
    return toNumber(result?.roundRate, 0);
  },
  async settlement(payload) {
    await shopApi.settlement(payload);
    return true;
  },
  async fetchPickupOrders(filters = {}) {
    const result = await shopApi.fetchOrderList({
      orderSn: String(filters.orderSn || filters.keyword || "").trim(),
      keywords: String(filters.keyword || "").trim(),
      orderType: toNumber(filters.orderType, 0)
    });
    const rawList = Array.isArray(result?.data)
      ? result.data
      : Array.isArray(result?.list)
        ? result.list
        : Array.isArray(result)
          ? result
          : [];
    return rawList
      .map(normalizePickupOrder)
      .filter((item) => {
        if (filters.historyOnly && item.status !== "done") {
          return false;
        }
        if (filters.keyword) {
          const target = `${item.orderSn} ${item.pickupCode} ${item.memberName} ${item.memberMobile}`;
          if (!target.includes(filters.keyword)) {
            return false;
          }
        }
        return filterPickupOrderByDate(item, filters);
      })
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  },
  async fetchOrderDetail(orderId) {
    const result = await shopApi.fetchOrderDetail({ orderId: toNumber(orderId) });
    return normalizePickupOrder({
      ...(result || {}),
      id: result?.id || result?.orderId || toNumber(orderId),
      orderId: result?.orderId || result?.id || toNumber(orderId)
    });
  },
  async printOrder(orderId) {
    await shopApi.print({ orderId: toNumber(orderId) });
    return true;
  },
  async fetchMoneyLogs(filters = {}) {
    const result = await shopApi.fetchMoneyLog({
      type: toNumber(filters.type, 0),
      keyword: String(filters.keyword || "").trim()
    });
    const rawList = Array.isArray(result?.data) ? result.data : [];
    return {
      total: toNumber(result?.total, rawList.length),
      page: toNumber(result?.current_page, 1),
      pageSize: toNumber(result?.per_page, rawList.length || 10),
      lastPage: toNumber(result?.last_page, 1),
      list: rawList.map((item) => ({
        id: toNumber(item.id),
        username: item.username || "",
        mobile: String(item.mobile || ""),
        avatar: item.avatar ? joinUrl(item.avatar) : "",
        money: toNumber(item.money),
        before: toNumber(item.before),
        after: toNumber(item.after),
        memo: item.memo || "",
        type: toNumber(item.type),
        typeName: item.typeName || "",
        createdAt: item.createtime || ""
      }))
    };
  },
  async goodsApply(payload) {
    await shopApi.goodsApply(payload);
    return true;
  },
  async completeApply(id) {
    await shopApi.completeApply({ id: toNumber(id) });
    return true;
  },
  async fetchApplyList(filters = {}) {
    const result = await shopApi.fetchApplyList({
      remark: String(filters.remark || "").trim(),
      goodsName: String(filters.goodsName || "").trim(),
      status: toNumber(filters.status, 0),
      starttime: String(filters.starttime || ""),
      endtime: String(filters.endtime || ""),
      page: toNumber(filters.page, 1)
    });
    const rawList = Array.isArray(result?.data) ? result.data : [];
    return {
      total: toNumber(result?.total, rawList.length),
      page: toNumber(result?.current_page, 1),
      pageSize: toNumber(result?.per_page, rawList.length || 10),
      lastPage: toNumber(result?.last_page, 1),
      list: rawList.map((item) => ({
        id: toNumber(item.id),
        remark: item.remark || "",
        opinion: item.opinion || "",
        status: toNumber(item.status),
        statusText: item.status_text || ({ 1: "待审核", 2: "已出库", 3: "已完成" }[toNumber(item.status)] || "待审核"),
        createdAt: item.createtime || "",
        outtime: item.outtime || "",
        dowtime: item.dowtime || "",
        items: Array.isArray(item.goods) ? item.goods.map((g) => ({
          goodsName: g.goodsName || "",
          image: g.mainImage ? joinUrl(g.mainImage) : "",
          applyQty: toNumber(g.applyNums, 1),
          approveQty: toNumber(g.approveNums, 0),
          statusText: g.status_text || ""
        })) : []
      }))
    };
  },
  async lookupPickupOrderByCode(code) {
    const pickupCode = String(code || "").trim();
    if (!pickupCode) {
      throw createApiError("请输入自提码");
    }
    const orders = await this.fetchPickupOrders({ orderSn: pickupCode });
    const matched = orders.find((item) => String(item.pickupCode) === pickupCode || String(item.orderSn) === pickupCode);
    if (!matched) {
      throw createApiError("未找到匹配的自提订单");
    }
    return this.fetchOrderDetail(matched.id);
  },
  async confirmPickupOrder(orderId) {
    const id = toNumber(orderId);
    if (!id) {
      throw createApiError("订单信息不完整");
    }
    await shopApi.pickUp({ orderId: id });
    return this.fetchOrderDetail(id);
  },
  async verifyPickupCode(code) {
    const matched = await this.lookupPickupOrderByCode(code);
    await shopApi.pickUp({ orderId: toNumber(matched.id) });
    return this.fetchOrderDetail(matched.id);
  },
  async fetchSalerList() {
    const result = await shopApi.fetchSalerList({});
    const rawList = Array.isArray(result)
      ? result
      : Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result?.list)
          ? result.list
          : [];
    return rawList.map((item) => ({
      id: toNumber(item.id),
      salerName: item.salerName || "",
      salerNo: item.salerNo || "",
      statusText: item.status_text || ""
    }));
  },
  async salerLogin(payload = {}) {
    const result = await shopApi.salerLogin({
      salerId: toNumber(payload.salerId),
      password: String(payload.password || "")
    });
    const saler = {
      salerId: String(result?.salerId ?? ""),
      salerName: result?.salerName || "",
      salerNo: result?.salerNo || "",
      loginTime: result?.logintime || ""
    };
    authStore.saveSaler(saler);
    return saler;
  },
  async fetchMemberReport(filters = {}) {
    const result = await shopApi.fetchMemberReport({
      userName: String(filters.userName || "").trim(),
      goodsName: String(filters.goodsName || "").trim(),
      salerId: String(filters.salerId || "").trim(),
      starttime: String(filters.starttime || ""),
      endtime: String(filters.endtime || "")
    });
    const rawList = Array.isArray(result)
      ? result
      : Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result?.list)
          ? result.list
          : [];
    return rawList.map((item) => ({
      username: item.username || "",
      mobile: String(item.mobile || ""),
      level: item.level || "",
      goodsName: item.goodsName || "",
      nums: toNumber(item.nums, 1),
      salePrice: toNumber(item.salePrice),
      total: toNumber(item.total),
      discount: toNumber(item.discount),
      price: toNumber(item.price),
      amount: toNumber(item.amount),
      payType: item.payType || "",
      createdAt: item.createtime || "",
      salerName: item.salerName || "",
      salerNo: item.salerNo || ""
    }));
  },
  async exportMemberReport(filters = {}) {
    const data = {
      userName: String(filters.userName || "").trim(),
      goodsName: String(filters.goodsName || "").trim(),
      salerId: String(filters.salerId || "").trim(),
      starttime: String(filters.starttime || ""),
      endtime: String(filters.endtime || "")
    };
    const url = joinUrl("shop/index/memberReportExport");
    const headers = { "Content-Type": "application/json" };
    const token = authStore.getToken();
    if (token) {
      headers.token = token;
    }
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw createApiError(`导出失败(${response.status})`, response.status);
    }
    const blob = await response.blob();
    if (!blob || !blob.size) {
      throw createApiError("导出文件为空");
    }
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    let filename = `会员报表_${filters.starttime || ""}_${filters.endtime || ""}.xlsx`;
    const disposition = response.headers.get("Content-Disposition");
    if (disposition) {
      const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(disposition);
      if (match) {
        try {
          filename = decodeURIComponent(match[1].trim());
        } catch (error) {
          filename = match[1].trim();
        }
      }
    }
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    return true;
  }
};
