<template>
  <div class="page-shell">
    <div v-if="notice" class="notice-banner" :class="notice.type">{{ notice.text }}</div>
    <AppHeader active="report" />

    <main class="report-main">
      <section class="panel report-filter">
        <div class="filter-row">
          <div class="filter-field">
            <label class="filter-label">会员 / 手机号</label>
            <input v-model.trim="filters.userName" class="field" placeholder="输入会员姓名或手机号" @keydown.enter="load" />
          </div>
          <div class="filter-field">
            <label class="filter-label">商品名称</label>
            <input v-model.trim="filters.goodsName" class="field" placeholder="输入商品名称" @keydown.enter="load" />
          </div>
          <div class="filter-field">
            <label class="filter-label">店员</label>
            <select v-model="filters.salerId" class="select-field">
              <option value="">全部</option>
              <option v-for="item in salers" :key="item.id" :value="String(item.id)">{{ item.salerName }}（{{ item.salerNo }}）</option>
            </select>
          </div>
        </div>

        <div class="filter-row">
          <div class="filter-field">
            <label class="filter-label">开始时间</label>
            <input v-model="filters.starttime" class="field" type="date" />
          </div>
          <div class="filter-field">
            <label class="filter-label">结束时间</label>
            <input v-model="filters.endtime" class="field" type="date" />
          </div>
          <div class="filter-actions">
            <button class="primary-btn" type="button" :disabled="loading" @click="load">查询</button>
            <button class="ghost-btn" type="button" :disabled="exporting" @click="exportReport">
              {{ exporting ? "导出中…" : "导出报表" }}
            </button>
            <button class="ghost-btn" type="button" :disabled="loading" @click="reset">重置</button>
          </div>
        </div>
      </section>

      <section class="panel report-body">
        <div class="report-summary">
          <div class="summary-item">
            <span class="summary-label">记录数</span>
            <strong class="summary-value">{{ list.length }}</strong>
          </div>
          <div class="summary-item">
            <span class="summary-label">销售总额</span>
            <strong class="summary-value money">¥{{ formatMoney(totalAmount) }}</strong>
          </div>
          <div class="summary-item">
            <span class="summary-label">优惠总额</span>
            <strong class="summary-value money">¥{{ formatMoney(totalDiscount) }}</strong>
          </div>
        </div>

        <div class="report-table-scroll">
          <table class="report-table">
            <thead>
              <tr>
                <th>会员</th>
                <th>手机号</th>
                <th>等级</th>
                <th>商品</th>
                <th>数量</th>
                <th>单价</th>
                <th>优惠</th>
                <th>实付</th>
                <th>支付方式</th>
                <th>时间</th>
                <th>店员</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in list" :key="index">
                <td>{{ item.username }}</td>
                <td>{{ item.mobile }}</td>
                <td>{{ item.level }}</td>
                <td class="goods-name">{{ item.goodsName }}</td>
                <td class="money">{{ item.nums }}</td>
                <td class="money">¥{{ formatMoney(item.salePrice) }}</td>
                <td class="money">¥{{ formatMoney(item.discount) }}</td>
                <td class="money amount">¥{{ formatMoney(item.amount) }}</td>
                <td>{{ item.payType }}</td>
                <td class="nowrap">{{ item.createdAt }}</td>
                <td>{{ item.salerName }}</td>
              </tr>
              <tr v-if="!list.length">
                <td colspan="11" class="empty-row">{{ loading ? "加载中…" : "暂无报表数据" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import AppHeader from "../components/AppHeader.vue";
import { api, formatMoney, getErrorMessage } from "../services/api.js";

const filters = reactive({
  userName: "",
  goodsName: "",
  salerId: "",
  starttime: defaultStart(),
  endtime: defaultEnd()
});

const list = ref([]);
const salers = ref([]);
const loading = ref(false);
const exporting = ref(false);
const notice = ref(null);
let noticeTimer = 0;

function showNotice(text, type = "info") {
  notice.value = { text, type };
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => {
    notice.value = null;
  }, 2400);
}

function defaultStart() {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return toDateInput(d);
}

function defaultEnd() {
  return toDateInput(new Date());
}

function toDateInput(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function buildParams() {
  return {
    userName: filters.userName,
    goodsName: filters.goodsName,
    salerId: filters.salerId,
    starttime: filters.starttime ? `${filters.starttime} 00:00:00` : "",
    endtime: filters.endtime ? `${filters.endtime} 23:59:59` : ""
  };
}

async function loadSalers() {
  try {
    salers.value = await api.fetchSalerList();
  } catch (error) {
    console.warn("店员列表加载失败", error);
  }
}

async function load() {
  loading.value = true;
  try {
    list.value = await api.fetchMemberReport(buildParams());
  } catch (error) {
    showNotice(getErrorMessage(error, "报表加载失败"), "error");
    list.value = [];
  } finally {
    loading.value = false;
  }
}

async function exportReport() {
  exporting.value = true;
  try {
    await api.exportMemberReport(buildParams());
    showNotice("报表导出成功");
  } catch (error) {
    showNotice(getErrorMessage(error, "报表导出失败"), "error");
  } finally {
    exporting.value = false;
  }
}

function reset() {
  filters.userName = "";
  filters.goodsName = "";
  filters.salerId = "";
  filters.starttime = defaultStart();
  filters.endtime = defaultEnd();
  load();
}

const totalAmount = computed(() =>
  list.value.reduce((sum, item) => sum + Number(item.amount || 0), 0)
);
const totalDiscount = computed(() =>
  list.value.reduce((sum, item) => sum + Number(item.discount || 0), 0)
);

onMounted(() => {
  loadSalers();
  load();
});

onBeforeUnmount(() => {
  window.clearTimeout(noticeTimer);
});
</script>

<style scoped>
.report-main {
  padding: 18px 20px 20px;
}

.report-filter {
  padding: 16px;
  background: rgba(255, 255, 255, 0.94);
}

.filter-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-row + .filter-row {
  margin-top: 12px;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 180px;
}

.filter-label {
  color: #5f6d87;
  font-size: 13px;
  font-weight: 700;
}

.filter-actions {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.report-body {
  margin-top: 16px;
  padding: 18px 20px 22px;
}

.report-summary {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
  padding-bottom: 14px;
  border-bottom: 1px solid #edf1f6;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
}

.summary-value {
  color: var(--text-strong);
  font-size: 22px;
  font-weight: 800;
}

.summary-value.amount {
  color: #d53b31;
}

.report-table-scroll {
  margin-top: 14px;
  max-height: calc(100vh - 360px);
  overflow: auto;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
}

.report-table th,
.report-table td {
  padding: 12px 14px;
  border-top: 1px solid #edf1f6;
  text-align: left;
  font-size: 14px;
  white-space: nowrap;
}

.report-table th {
  background: rgba(15, 23, 42, 0.04);
  color: #475569;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  position: sticky;
  top: 0;
  z-index: 1;
}

.report-table tbody tr:hover {
  background: rgba(79, 135, 255, 0.04);
}

.goods-name {
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.amount {
  color: #d53b31;
  font-weight: 700;
}

.nowrap {
  white-space: nowrap;
}

.empty-row {
  text-align: center;
  padding: 40px 0;
  color: var(--text-muted);
}

.notice-banner {
  position: fixed;
  left: 50%;
  bottom: 24px;
  z-index: 140;
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

@media (max-width: 720px) {
  .filter-field {
    min-width: 100%;
  }

  .report-table-scroll {
    max-height: calc(100vh - 420px);
  }
}
</style>
