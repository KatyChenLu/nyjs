<template>
  <div class="page-shell">
    <AppHeader active="pickup" />

    <main class="pickup-main">
      <div class="pickup-layout panel">
        <aside class="pickup-sidebar">
          <div class="filter-row">
            <input
              v-model.trim="filters.keyword"
              class="field"
              placeholder="输入订单号"
              @keyup.enter="loadOrders"
            />
            <button class="primary-btn" type="button" @click="loadOrders">搜索</button>
            <button class="ghost-btn refresh-btn" type="button" @click="loadOrders">刷新</button>
          </div>

          <div class="filter-row filter-row-date">
            <input v-model="filters.startDate" class="field" type="date" />
            <input v-model="filters.endDate" class="field" type="date" />
          </div>

          <label class="history-check">
            <input v-model="filters.historyOnly" type="checkbox" @change="loadOrders" />
            <span>只看已自提订单</span>
          </label>

          <button class="ghost-btn scan-open-btn" type="button" @click="openVerifyDialog">
            输入或扫描自提码
          </button>

          <div class="pickup-list">
            <button
              v-for="item in orders"
              :key="item.id"
              class="pickup-list-item"
              :class="{ active: selectedOrder?.orderSn === item.orderSn }"
              type="button"
              @click="selectedOrder = item"
            >
              <div class="pickup-list-top">
                <span class="pickup-code">{{ item.pickupCode }}</span>
                <span class="badge" :class="item.status">{{ item.statusText }}</span>
              </div>
              <div class="pickup-time">{{ item.createdAt }}</div>
              <div class="pickup-amount money">¥{{ formatMoney(item.actualAmount) }}</div>
            </button>
          </div>
        </aside>

        <section class="pickup-detail">
          <template v-if="selectedOrder">
            <div class="detail-header">
              <div>
                <div class="detail-order-sn">订单编号：{{ selectedOrder.orderSn }}</div>
                <!-- <div class="detail-note">当前已接入 `shop/index/orderList`、`shop/index/orderDetail`、`shop/index/pickUp`、`shop/index/print`。</div> -->
              </div>
              <span class="badge" :class="selectedOrder.status">{{ selectedOrder.statusText }}</span>
            </div>

            <table class="detail-table">
              <thead>
                <tr>
                  <th>品名</th>
                  <th>单价</th>
                  <th>优惠</th>
                  <th>数量</th>
                  <th>小计</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in selectedOrder.items" :key="item.id">
                  <td>{{ item.goodsName }}</td>
                  <td class="money">¥{{ formatMoney(item.price) }}</td>
                  <td class="money">¥{{ formatMoney(item.discount) }}</td>
                  <td>{{ item.qty }}</td>
                  <td class="money">¥{{ formatMoney(item.subtotal) }}</td>
                </tr>
              </tbody>
            </table>

            <div class="detail-summary">
              <div>共{{ selectedOrder.itemCount }}件</div>
              <div class="money">总额：¥{{ formatMoney(selectedOrder.totalAmount) }}</div>
              <div class="money">优惠：¥{{ formatMoney(selectedOrder.discountAmount) }}</div>
              <div v-if="selectedOrder.roundPrice" class="money">抹零优惠：¥{{ formatMoney(selectedOrder.roundPrice) }}</div>
              <div class="money">应收：¥{{ formatMoney(selectedOrder.payableAmount) }}</div>
            </div>

            <div class="detail-real-pay money">实收（{{ selectedOrder.payLabel }}）：¥{{ formatMoney(selectedOrder.actualAmount) }}</div>

            <div class="detail-meta">
              <div>自提时间：{{ selectedOrder.pickupAt }}</div>
              <div>自提门店：{{ selectedOrder.shopName }}</div>
              <div>会员名：{{ selectedOrder.memberName }}</div>
              <div v-if="selectedOrder.memberMobile">手机号：{{ selectedOrder.memberMobile }}</div>
              <div v-if="selectedOrder.actualPickupAt">核销时间：{{ selectedOrder.actualPickupAt }}</div>
            </div>

            <div class="detail-actions">
              <!-- <button class="danger-btn" type="button" disabled>退款</button> -->
              <button class="primary-btn" type="button" @click="printSelectedOrder2">打印</button>
            </div>
          </template>

          <div v-else class="detail-empty">暂无订单，请先搜索或扫描自提码。</div>
        </section>
      </div>
    </main>

    <div v-if="notice" class="notice-banner" :class="notice.type">{{ notice.text }}</div>

    <div v-if="verifyVisible" class="dialog-mask" @click.self="closeVerifyDialog">
      <div class="dialog-card">
        <div class="dialog-title">输入或扫描自提码</div>
        <input
          ref="verifyInputRef"
          v-model.trim="verifyCode"
          class="field"
          placeholder="请输入自提码（扫描）"
          @keyup.enter="submitVerify"
        />
        <div class="dialog-actions">
          <button class="ghost-btn" type="button" @click="closeVerifyDialog">取消</button>
          <button class="primary-btn" type="button" @click="submitVerify">查找订单</button>
        </div>
      </div>
    </div>

    <div v-if="confirmVisible && pendingOrder" class="dialog-mask" @click.self="closeConfirmDialog">
      <div class="dialog-card confirm-dialog">
        <div class="dialog-title">确认核销订单</div>
        <div class="confirm-order-sn">订单编号：{{ pendingOrder.orderSn }}</div>
        <div class="confirm-meta">
          <div>自提码：{{ pendingOrder.pickupCode || '-' }}</div>
          <div>会员名：{{ pendingOrder.memberName || '-' }}</div>
          <div v-if="pendingOrder.memberMobile">手机号：{{ pendingOrder.memberMobile }}</div>
          <div>自提门店：{{ pendingOrder.shopName || '-' }}</div>
          <div>应收：¥{{ formatMoney(pendingOrder.payableAmount) }}</div>
          <div>实收（{{ pendingOrder.payLabel }}）：¥{{ formatMoney(pendingOrder.actualAmount) }}</div>
        </div>
        <table class="confirm-table">
          <thead>
            <tr>
              <th>品名</th>
              <th>数量</th>
              <th>小计</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in pendingOrder.items" :key="item.id">
              <td>{{ item.goodsName }}</td>
              <td>{{ item.qty }}</td>
              <td class="money">¥{{ formatMoney(item.subtotal) }}</td>
            </tr>
          </tbody>
        </table>
        <div class="dialog-actions">
          <button class="ghost-btn" type="button" @click="closeConfirmDialog">取消</button>
          <button class="primary-btn" type="button" @click="confirmVerify">确认核销</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import AppHeader from "../components/AppHeader.vue";
import { api, authStore, formatDateTime, formatMoney, getErrorMessage } from "../services/api.js";
import { registerScannerListener } from "../services/scanner.js";
import { printReceipt } from "../utils/print.js";
import { isXpyunConfigured, printXpyunReceipt } from "../services/xpyun.js";

const filters = ref({
  keyword: "",
  startDate: "",
  endDate: "",
  historyOnly: false
});

const orders = ref([]);
const selectedOrder = ref(null);
const detailLoading = ref(false);
const verifyVisible = ref(false);
const verifyCode = ref("");
const verifyInputRef = ref(null);
const confirmVisible = ref(false);
const pendingOrder = ref(null);
const notice = ref(null);

let removeScannerListener = () => {};
let noticeTimer = 0;

function showNotice(text, type = "info") {
  notice.value = { text, type };
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => {
    notice.value = null;
  }, 2400);
}

async function loadOrders() {
  try {
    orders.value = await api.fetchPickupOrders({ ...filters.value, orderType: 1 });
    if (!selectedOrder.value && orders.value.length) {
      selectedOrder.value = orders.value[0];
      return;
    }
    if (selectedOrder.value) {
      const matched = orders.value.find((item) => item.id === selectedOrder.value.id);
      selectedOrder.value = matched || orders.value[0] || null;
    }
  } catch (error) {
    showNotice(getErrorMessage(error, "自提订单加载失败"), "error");
  }
}

async function loadOrderDetail(orderId) {
  if (!orderId) {
    return;
  }
  detailLoading.value = true;
  try {
    selectedOrder.value = await api.fetchOrderDetail(orderId);
  } catch (error) {
    showNotice(getErrorMessage(error, "订单详情加载失败"), "error");
  } finally {
    detailLoading.value = false;
  }
}

function openVerifyDialog() {
  verifyVisible.value = true;
  verifyCode.value = "";
  nextTick(() => verifyInputRef.value?.focus());
}

function closeVerifyDialog() {
  verifyVisible.value = false;
  verifyCode.value = "";
}

function closeConfirmDialog() {
  confirmVisible.value = false;
  pendingOrder.value = null;
}

async function submitVerify() {
  try {
    pendingOrder.value = await api.lookupPickupOrderByCode(verifyCode.value);
    closeVerifyDialog();
    confirmVisible.value = true;
  } catch (error) {
    showNotice(getErrorMessage(error, "订单查询失败"), "error");
  }
}

async function confirmVerify() {
  if (!pendingOrder.value?.id) {
    return;
  }
  try {
    const order = await api.confirmPickupOrder(pendingOrder.value.id);
    await loadOrders();
    selectedOrder.value = orders.value.find((item) => item.id === order.id) || order;
    await loadOrderDetail(selectedOrder.value.id);
    closeConfirmDialog();
    showNotice("核销成功");
  } catch (error) {
    showNotice(getErrorMessage(error, "核销失败"), "error");
  }
}

async function printSelectedOrder2() {
  if (!selectedOrder.value) {
    return;
  }
  try {
    await api.printOrder(selectedOrder.value.id);
  } catch (error) {
    showNotice(getErrorMessage(error, "打印指令发送失败"), "error");
    return;
  }
  showNotice("打印指令已发送");
}
async function printSelectedOrder() {
  if (!selectedOrder.value) {
    return;
  }
  try {
    if (isXpyunConfigured()) {
      await printXpyunReceipt({
        title: "汇泽农业自提单",
        shopName: selectedOrder.value.shopName,
        time: formatDateTime(new Date()),
        orderSn: selectedOrder.value.orderSn,
        cashierName: authStore.getCachedSaler()?.salerName || "",
        lines: selectedOrder.value.items.map((item) => ({
          name: item.goodsName,
          qty: `${item.qty}`,
          price: item.price,
          amount: item.subtotal
        })),
        totals: [
          { label: "件数", value: `${selectedOrder.value.itemCount}` },
          { label: "总额", value: `¥${formatMoney(selectedOrder.value.totalAmount)}` },
          { label: "优惠", value: `¥${formatMoney(selectedOrder.value.discountAmount)}` },
          { label: "实收", value: `¥${formatMoney(selectedOrder.value.actualAmount)}` }
        ],
        footer: `支付方式：${selectedOrder.value.payLabel}`
      }, {
        idempotent: `pickup_${selectedOrder.value.orderSn || selectedOrder.value.id}_${Date.now()}`
      });
      window.alert("打印指令已发送到芯烨云打印机");
      return;
    }

    await api.printOrder(selectedOrder.value.id);
  } catch (error) {
    window.alert(`${getErrorMessage(error, "打印指令发送失败")}，将改用浏览器打印`);
  }
  printReceipt({
    title: "汇泽农业自提单",
    shopName: selectedOrder.value.shopName,
    time: formatDateTime(new Date()),
    orderSn: selectedOrder.value.orderSn,
    cashierName: authStore.getCachedSaler()?.salerName || "",
    lines: selectedOrder.value.items.map((item) => ({
      name: item.goodsName,
      qty: `${item.qty}`,
      price: item.price,
      amount: item.subtotal
    })),
    totals: [
      { label: "件数", value: `${selectedOrder.value.itemCount}` },
      { label: "总额", value: `¥${formatMoney(selectedOrder.value.totalAmount)}` },
      { label: "优惠", value: `¥${formatMoney(selectedOrder.value.discountAmount)}` },
      { label: "实收", value: `¥${formatMoney(selectedOrder.value.actualAmount)}` }
    ],
    footer: `支付方式：${selectedOrder.value.payLabel}`
  });
}

onMounted(() => {
  loadOrders();
  removeScannerListener = registerScannerListener("pickup-page", (code) => {
    if (!verifyVisible.value) {
      openVerifyDialog();
    }
    verifyCode.value = code;
    nextTick(() => submitVerify());
  });
});

onBeforeUnmount(() => {
  removeScannerListener();
  window.clearTimeout(noticeTimer);
});

watch(
  () => selectedOrder.value?.id,
  (orderId, previousId) => {
    if (!orderId || orderId === previousId) {
      return;
    }
    loadOrderDetail(orderId);
  },
  { immediate: false }
);
</script>

<style scoped>
.pickup-main {
  padding: 18px 20px 20px;
}

.pickup-layout {
  display: grid;
  grid-template-columns: 460px 1fr;
  height: calc(100vh - 180px);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.96);
}

.pickup-sidebar {
  padding: 18px;
  border-right: 1px solid #e7edf5;
  background: rgba(255, 255, 255, 0.98);
}

.pickup-sidebar .primary-btn,
.detail-actions .primary-btn {
  background: linear-gradient(135deg, #4f87ff 0%, #315cf0 100%);
  color: #ffffff;
  box-shadow: 0 16px 28px rgba(49, 92, 240, 0.24);
}

.pickup-sidebar .primary-btn:hover,
.detail-actions .primary-btn:hover {
  box-shadow: 0 20px 34px rgba(49, 92, 240, 0.28);
}

.filter-row {
  display: flex;
  gap: 10px;
}

.refresh-btn {
  min-width: 88px;
}

.filter-row + .filter-row {
  margin-top: 12px;
}

.filter-row-date {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.history-check {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  color: var(--text-strong);
}

.scan-open-btn {
  width: 100%;
  margin-top: 16px;
}

.pickup-list {
  margin-top: 20px;
  display: grid;
  gap: 10px;
  max-height: calc(100vh - 320px);
  overflow: auto;
  padding-right: 4px;
}

.pickup-list-item {
  border: 1px solid #e3e9f2;
  border-radius: 16px;
  background: #ffffff;
  padding: 16px;
  text-align: left;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.pickup-list-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.pickup-list-item.active {
  background: linear-gradient(135deg, #4f87ff 0%, #315cf0 100%);
  color: #ffffff;
  border-color: #3d66ef;
  box-shadow: 0 18px 30px rgba(49, 92, 240, 0.24);
}

.pickup-list-item.active .pickup-time,
.pickup-list-item.active .pickup-list-top .badge {
  color: rgba(255, 255, 255, 0.9);
}

.pickup-list-item.active .pickup-list-top .badge {
  background: rgba(255, 255, 255, 0.18);
}

.pickup-list-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.pickup-code {
  flex: 1;
  min-width: 0;
  font-size: 18px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pickup-list-top .badge {
  flex-shrink: 0;
}

.pickup-time {
  margin-top: 10px;
}

.pickup-amount {
  margin-top: 6px;
  font-size: 26px;
  font-weight: 800;
}

.pickup-detail {
  padding: 18px 20px 24px;
  background: rgba(246, 248, 251, 0.94);
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.detail-order-sn {
  color: var(--text-strong);
  font-size: 24px;
  font-weight: 800;
}

.detail-note {
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 13px;
}

.detail-table {
  width: 100%;
  margin-top: 18px;
  border-collapse: collapse;
  background: #ffffff;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.detail-table th,
.detail-table td {
  padding: 16px;
  border-bottom: 1px solid #e9eef5;
}

.detail-table th {
  background: #f4f7fb;
  text-align: left;
  color: #4b5565;
}

.detail-summary {
  display: flex;
  justify-content: flex-end;
  gap: 32px;
  margin-top: 18px;
  color: var(--text-strong);
  font-weight: 700;
  flex-wrap: wrap;
}

.detail-real-pay {
  margin-top: 18px;
  text-align: right;
  color: var(--danger);
  font-size: 28px;
  font-weight: 800;
}

.detail-meta {
  margin-top: 28px;
  color: var(--text-strong);
  line-height: 2;
}

.detail-actions {
  margin-top: 28px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.detail-empty {
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--text-muted);
  font-size: 18px;
}

.notice-banner {
  position: fixed;
  left: 50%;
  bottom: 24px;
  z-index: 40;
  transform: translateX(-50%);
  min-width: 280px;
  padding: 14px 18px;
  border-radius: 14px;
  font-weight: 700;
}

.notice-banner.info {
  background: rgba(18, 63, 113, 0.92);
  color: #ffffff;
}

.notice-banner.error {
  background: rgba(229, 57, 53, 0.92);
  color: #ffffff;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  background: rgba(6, 18, 33, 0.42);
  backdrop-filter: blur(4px);
}

.dialog-card {
  width: min(420px, calc(100vw - 24px));
  padding: 20px;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: var(--shadow-lg);
}

.confirm-dialog {
  width: min(720px, calc(100vw - 24px));
}

.dialog-title {
  margin-bottom: 18px;
  color: var(--text-strong);
  font-size: 22px;
  font-weight: 800;
}

.confirm-order-sn {
  color: var(--text-strong);
  font-size: 18px;
  font-weight: 800;
}

.confirm-meta {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 18px;
  color: var(--text-strong);
}

.confirm-table {
  width: 100%;
  margin-top: 18px;
  border-collapse: collapse;
  background: #ffffff;
  border: 1px solid #e9eef5;
  border-radius: 14px;
  overflow: hidden;
}

.confirm-table th,
.confirm-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #e9eef5;
  text-align: left;
}

.confirm-table th {
  background: #f4f7fb;
  color: #4b5565;
}

.confirm-table tbody tr:last-child td {
  border-bottom: none;
}

.dialog-actions {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 1080px) {
  .pickup-layout {
    grid-template-columns: 1fr;
  }

  .pickup-sidebar {
    border-right: none;
    border-bottom: 1px solid #e7edf5;
  }
}

@media (max-width: 720px) {
  .pickup-main {
    padding: 14px 12px 16px;
  }

  .filter-row,
  .detail-summary,
  .detail-actions {
    flex-wrap: wrap;
  }

  .confirm-meta {
    grid-template-columns: 1fr;
  }

  .refresh-btn {
    width: 100%;
  }
}
</style>
