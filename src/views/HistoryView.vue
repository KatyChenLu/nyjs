<template>
  <div class="page-shell">
    <AppHeader active="history" />

    <main class="history-main">
      <section class="panel history-filter">
        <div class="filter-row">
          <input v-model.trim="filters.keyword" class="field" placeholder="输入订单号/会员手机号" @keyup.enter="load" />
          <button class="primary-btn" type="button" @click="load">搜索</button>
          <button class="ghost-btn" type="button" @click="reset">重置</button>
        </div>
        <div class="filter-row filter-row-date">
          <input v-model="filters.startDate" class="field" type="date" />
          <input v-model="filters.endDate" class="field" type="date" />
          <label class="checkbox-label">
            <input v-model="historyOnly" class="checkbox-input" type="checkbox" @change="load" />
            <span class="checkbox-text">仅查看已完成</span>
          </label>
          <label class="checkbox-label">
            <input v-model="offlineOnly" class="checkbox-input" type="checkbox" @change="load" />
            <span class="checkbox-text">仅查看线下订单</span>
          </label>
          <button class="ghost-btn" type="button" @click="load">刷新</button>
        </div>
      </section>

      <section class="panel history-body">
        <aside class="history-list">
            <button
            v-for="item in list"
            :key="item.id"
            class="history-item"
            :class="[statusItemClass(item), { active: selected?.id === item.id }]"
            type="button"
            @click="selectRecord(item)"
          >
            <div class="history-item-top">
              <span class="history-sn">{{ item.orderSn }}</span>
              <span class="history-pay" :class="payClass(item.payLabel)">{{ item.payLabel }}</span>
            </div>
            <div class="history-item-mid">
              <span class="muted">{{ item.createdAt }}</span>
              <span class="money">¥{{ formatMoney(item.actualAmount) }}</span>
            </div>
            <div class="history-item-bottom muted">
              <span v-if="item.memberMobile">会员 {{ item.memberMobile }}</span>
              <span v-else>散客</span>
              <span class="history-status-tag" :class="'status-' + resolveStatusKey(item)">{{ item.statusText || '未知' }}</span>
            </div>
          </button>

          <div v-if="!list.length" class="history-empty muted">暂无交易记录</div>
        </aside>

        <section class="history-detail">
          <div v-if="selected" class="detail-card" :class="statusDetailClass(selected)">
            <div class="detail-head">
              <div>
              <div class="detail-title">交易单号：{{ selected.orderSn }}</div>
                <div class="detail-sub muted">{{ selected.createdAt }}</div>
                <div class="detail-sub">{{ selected.username }}</div>
              </div>
              <div class="detail-head-right">
                <div class="detail-amount money">¥{{ formatMoney(selected.actualAmount) }}</div>
                <button
                  class="ghost-btn print-btn"
                  type="button"
                  :disabled="printingOrderId === selected.id"
                  @click="reprint(selected)"
                >
                  {{ printingOrderId === selected.id ? "打印中..." : "重新打印小票" }}
                </button>
              </div>
            </div>

            <div class="detail-meta">
              <div>支付方式：{{ selected.payLabel }}</div>
              <div>订单类型：{{ orderTypeLabel(selected.orderType) }}</div>
              <div class="detail-meta-status">
                订单状态：
                <span class="status-tag" :class="'status-' + resolveStatusKey(selected)">{{ selected.statusText }}</span>
              </div>
              <div>门店：{{ selected.shopName }}</div>
              <div v-if="selected.memberMobile">会员手机号：{{ selected.memberMobile }}</div>
              <div v-if="selected.discountAmount">优惠：-¥{{ formatMoney(selected.discountAmount) }}</div>
              <div v-if="selected.roundPrice">抹零优惠：-¥{{ formatMoney(selected.roundPrice) }}</div>
            </div>

            <div v-if="selected.aerialPilotName || selected.aerialPrice" class="detail-aerial">
              <div class="detail-aerial-title">飞防信息</div>
              <div class="detail-aerial-grid">
                <div v-if="selected.aerialPilotName">飞手：{{ selected.aerialPilotName }}</div>
                <div v-if="selected.aerialPilotMobile">手机号：{{ selected.aerialPilotMobile }}</div>
                <div v-if="selected.aerialStatusText" class="detail-aerial-status">
                  飞防状态：
                  <span class="aerial-tag">{{ selected.aerialStatusText }}</span>
                </div>
                <div v-if="selected.aerialAppointAt">预约时间：{{ selected.aerialAppointAt }}</div>
                <div v-if="selected.aerialPrice">飞防金额：¥{{ formatMoney(selected.aerialPrice) }}</div>
              </div>
            </div>

            <table class="detail-table">
              <thead>
                <tr>
                  <th>品名</th>
                  <th>单价</th>
                  <th>数量</th>
                  <th>小计</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="line in selected.items" :key="line.id">
                  <td>{{ line.goodsName }}</td>
                  <td class="money">¥{{ formatMoney(line.price) }}</td>
                  <td>{{ line.qty }}</td>
                  <td class="money">¥{{ formatMoney(line.subtotal) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="detail-empty muted">请选择一条交易记录查看详情</div>
        </section>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import AppHeader from "../components/AppHeader.vue";
import { api, formatMoney, getErrorMessage } from "../services/api.js";

const filters = ref({
  keyword: "",
  startDate: "",
  endDate: ""
});

const historyOnly = ref(false);
const offlineOnly = ref(false);

const list = ref([]);
const selected = ref(null);
const printingOrderId = ref("");

function inDateRange(item) {
  const start = filters.value.startDate ? `${filters.value.startDate} 00:00:00` : "";
  const end = filters.value.endDate ? `${filters.value.endDate} 23:59:59` : "";
  if (start && item.createdAt < start) return false;
  if (end && item.createdAt > end) return false;
  return true;
}

function matchKeyword(item) {
  const keyword = String(filters.value.keyword || "").trim();
  if (!keyword) return true;
  const target = `${item.orderSn} ${item.memberMobile || ""} ${item.memberName || ""}`;
  return target.includes(keyword);
}

async function load() {
  try {
    const all = await api.fetchPickupOrders({
      ...filters.value,
      historyOnly: historyOnly.value,
      orderType: offlineOnly.value ? 2 : 0
    });
    console.log("🚀 ~ load ~ all:", all)
    list.value = all.filter((item) => inDateRange(item) && matchKeyword(item));
    if (!list.value.length) {
      selected.value = null;
      return;
    }
    const next = selected.value
      ? list.value.find((item) => item.id === selected.value.id) || list.value[0]
      : list.value[0];
    selected.value = await api.fetchOrderDetail(next.id);
  } catch (error) {
    list.value = [];
    selected.value = null;
    window.alert(getErrorMessage(error, "历史订单加载失败"));
  }
}

async function selectRecord(item) {
  selected.value = await api.fetchOrderDetail(item.id);
}

function reset() {
  filters.value = {
    keyword: "",
    startDate: "",
    endDate: ""
  };
  historyOnly.value = false;
  offlineOnly.value = false;
  load();
}

function payClass(label) {
  if (!label) return "";
  if (label.includes("微信") || label.includes("支付宝")) return "pay-wechat";
  if (label.includes("余额")) return "pay-balance";
  if (label.includes("现金")) return "pay-cash";
  return "";
}

function orderTypeLabel(value) {
  const map = {
    0: "全部",
    1: "线上订单",
    2: "线下订单"
  };
  return map[Number(value)] || `未知类型(${value ?? ""})`;
}

function resolveStatusKey(item = {}) {
  const text = String(item.statusText || "").trim();
  if (/已完成|已自提|已签收|已核销/.test(text)) return "done";
  if (/配送中/.test(text)) return "shipping";
  if (/待自提/.test(text)) return "pickup";
  if (/已付款/.test(text)) return "paid";
  if (/待付款/.test(text)) return "waitpay";
  if (/已取消/.test(text)) return "canceled";
  if (/退款/.test(text)) return "refund";
  return "pending";
}

function statusItemClass(item) {
  return `item-${resolveStatusKey(item)}`;
}

function statusDetailClass(item) {
  return `detail-${resolveStatusKey(item)}`;
}

async function reprint(record) {
  if (printingOrderId.value === record.id) {
    return;
  }

  printingOrderId.value = record.id;
  try {
    await api.printOrder(record.id);
  } catch (error) {
    window.alert(getErrorMessage(error, "打印指令发送失败"));
  } finally {
    printingOrderId.value = "";
  }
}

onMounted(() => {
  load();
});
</script>

<style scoped>
.history-main {
  padding: 18px 20px 20px;
}

.history-filter {
  padding: 16px;
  background: rgba(255, 255, 255, 0.94);
}

.history-filter .primary-btn {
  background: linear-gradient(135deg, #4f87ff 0%, #315cf0 100%);
  color: #ffffff;
  box-shadow: 0 16px 28px rgba(49, 92, 240, 0.22);
}

.filter-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-row + .filter-row {
  margin-top: 12px;
}

.filter-row-date {
  display: grid;
  grid-template-columns: 1fr 1fr auto 120px;
  gap: 12px;
  align-items: center;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  accent-color: #4f87ff;
  cursor: pointer;
}

.checkbox-text {
  color: #5f6d87;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.history-body {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 380px 1fr;
  height: calc(100vh - 342px);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.96);
}

.history-list {
  padding: 14px;
  border-right: 1px solid #e7edf5;
  display: grid;
  gap: 10px;
  overflow: auto;
  align-content: start;
}

.history-item {
  height: 108px;
  border: 1px solid #e3e9f2;
  border-radius: 16px;
  background: #ffffff;
  padding: 14px 14px 12px;
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 8px;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.history-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.history-item.active {
  border-color: #3d66ef !important;
  background: linear-gradient(135deg, #4f87ff 0%, #315cf0 100%) !important;
  box-shadow: 0 18px 30px rgba(49, 92, 240, 0.2);
}

.history-item.active .history-sn,
.history-item.active .history-item-mid,
.history-item.active .history-item-mid .muted,
.history-item.active .history-item-bottom,
.history-item.active .history-item-bottom span {
  color: #ffffff;
}

.history-item.active .history-status-tag {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.2);
}

.history-item.active .history-pay {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.18);
}

.history-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.history-sn {
  color: var(--text-strong);
  font-weight: 800;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-pay {
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

.history-pay.pay-wechat {
  color: #2e7d32;
  background: #e8f5e9;
}

.history-pay.pay-balance {
  color: #3b6fa5;
  background: #eef4ff;
}

.history-pay.pay-cash {
  color: #e67e00;
  background: #fff3e0;
}

.history-item-mid {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.history-item-bottom {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
}

.history-status-tag {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.history-status-tag.status-done {
  color: #2e7d32;
  background: #e8f5e9;
}

.history-status-tag.status-shipping {
  color: #1a56a0;
  background: #dbeafe;
}

.history-status-tag.status-pickup {
  color: #7c5e00;
  background: #fef3c7;
}

.history-status-tag.status-paid {
  color: #6b4e9c;
  background: #ede9fe;
}

.history-status-tag.status-waitpay {
  color: #c65a1e;
  background: #ffedd5;
}

.history-status-tag.status-canceled {
  color: #9a9a9a;
  background: #f3f3f5;
}

.history-status-tag.status-refund {
  color: #c0392b;
  background: #fce4e4;
}

.history-status-tag.status-pending {
  color: #e67e00;
  background: #fff3e0;
}

/* 列表项按状态背景色 */
.history-item.item-done {
  background: rgba(22, 163, 74, 0.04);
  border-color: rgba(22, 163, 74, 0.15);
}

.history-item.item-shipping {
  background: rgba(37, 99, 235, 0.04);
  border-color: rgba(37, 99, 235, 0.15);
}

.history-item.item-pickup {
  background: rgba(202, 138, 4, 0.04);
  border-color: rgba(202, 138, 4, 0.15);
}

.history-item.item-paid {
  background: rgba(124, 58, 237, 0.04);
  border-color: rgba(124, 58, 237, 0.15);
}

.history-item.item-waitpay {
  background: rgba(234, 88, 12, 0.04);
  border-color: rgba(234, 88, 12, 0.15);
}

.history-item.item-canceled {
  background: rgba(113, 113, 122, 0.04);
  border-color: rgba(113, 113, 122, 0.12);
}

.history-item.item-refund {
  background: rgba(220, 38, 38, 0.04);
  border-color: rgba(220, 38, 38, 0.15);
}

.history-item.item-pending {
  background: rgba(245, 158, 11, 0.04);
  border-color: rgba(245, 158, 11, 0.15);
}

.history-item-mid .muted,
.history-item-bottom span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-empty {
  padding: 40px 0;
  text-align: center;
}

.history-detail {
  padding: 18px;
  background: rgba(246, 248, 251, 0.94);
  overflow: auto;
}

.detail-card {
  background: #ffffff;
  border: 1px solid #e3e9f2;
  border-radius: 18px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.detail-head {
  padding: 18px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #edf1f6;
}

.detail-head-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.detail-title {
  color: var(--text-strong);
  font-size: 18px;
  font-weight: 800;
}

.detail-sub {
  margin-top: 6px;
  font-size: 13px;
}

.detail-amount {
  font-size: 24px;
  font-weight: 900;
  color: var(--navy-800);
}

.print-btn {
  min-width: 132px;
}

.detail-meta {
  padding: 14px 18px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 14px;
  color: #475467;
}

.detail-meta-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.status-tag.status-done {
  color: #2e7d32;
  background: #e8f5e9;
}

.status-tag.status-shipping {
  color: #1a56a0;
  background: #dbeafe;
}

.status-tag.status-pickup {
  color: #7c5e00;
  background: #fef3c7;
}

.status-tag.status-paid {
  color: #6b4e9c;
  background: #ede9fe;
}

.status-tag.status-waitpay {
  color: #c65a1e;
  background: #ffedd5;
}

.status-tag.status-canceled {
  color: #9a9a9a;
  background: #f3f3f5;
}

.status-tag.status-refund {
  color: #c0392b;
  background: #fce4e4;
}

.status-tag.status-pending {
  color: #e67e00;
  background: #fff3e0;
}

/* 详情卡按状态背景色 */
.detail-card.detail-done {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-color: rgba(22, 163, 74, 0.2);
}

.detail-card.detail-shipping {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: rgba(37, 99, 235, 0.2);
}

.detail-card.detail-pickup {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-color: rgba(202, 138, 4, 0.2);
}

.detail-card.detail-paid {
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  border-color: rgba(124, 58, 237, 0.2);
}

.detail-card.detail-waitpay {
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  border-color: rgba(234, 88, 12, 0.2);
}

.detail-card.detail-canceled {
  background: linear-gradient(135deg, #fafafa 0%, #f4f4f5 100%);
  border-color: rgba(113, 113, 122, 0.15);
}

.detail-card.detail-refund {
  background: linear-gradient(135deg, #fef2f2 0%, #fce4e4 100%);
  border-color: rgba(220, 38, 38, 0.2);
}

.detail-card.detail-pending {
  background: linear-gradient(135deg, #fffbeb 0%, #fef9e7 100%);
  border-color: rgba(245, 158, 11, 0.2);
}

.detail-aerial {
  margin: 0 18px;
  padding: 14px 0;
  border-top: 1px solid #edf1f6;
}

.detail-aerial-title {
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 10px;
}

.detail-aerial-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 14px;
  color: #475467;
  font-size: 14px;
}

.detail-aerial-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.aerial-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #3b6fa5;
  background: #eef4ff;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
}

.detail-table th,
.detail-table td {
  padding: 14px 18px;
  border-top: 1px solid #edf1f6;
  text-align: left;
}

.detail-table th {
  background: rgba(15, 23, 42, 0.04);
  color: #475569;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.detail-empty {
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 16px;
}

@media (max-width: 1080px) {
  .history-body {
    grid-template-columns: 1fr;
  }

  .history-list {
    border-right: none;
    border-bottom: 1px solid #e7edf5;
    max-height: 380px;
  }
}

@media (max-width: 720px) {
  .filter-row {
    flex-wrap: wrap;
  }

  .filter-row-date {
    grid-template-columns: 1fr;
  }

  .detail-head {
    flex-direction: column;
  }

  .detail-head-right {
    align-items: stretch;
  }

  .detail-meta {
    grid-template-columns: 1fr;
  }
}
</style>
