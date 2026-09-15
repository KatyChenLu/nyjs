<template>
  <div class="page-shell">
    <div v-if="notice" class="notice-banner" :class="notice.type">{{ notice.text }}</div>
    <AppHeader active="material" />

    <main class="material-main">
      <section class="apply-hero panel">
        <div class="apply-hero-main">
          <div class="apply-hero-icon" aria-hidden="true">
            <Box />
          </div>
          <div>
            <div class="apply-title">物料申请</div>
            <div class="apply-subtitle">从仓库选择物料，提交申请以备库存发起申请</div>
          </div>
        </div>

        <div class="apply-hero-actions">
          <button class="pick-btn" type="button" @click="openLibrary">选择物料</button>
          <button class="submit-btn" type="button" :disabled="submitting || !applyItems.length" @click="submitApply">
            {{ submitting ? "提交中..." : "提交申请" }}
          </button>
        </div>
      </section>

      <section class="apply-summary panel">
        <div class="summary-chip">
          <div class="summary-icon" aria-hidden="true">
            <House />
          </div>
          <div class="summary-copy">
            <span>申请门店</span>
            <strong>{{ shopName }}</strong>
          </div>
        </div>
        <div class="summary-chip">
          <div class="summary-icon" aria-hidden="true">
            <User />
          </div>
          <div class="summary-copy">
            <span>申请人</span>
            <strong>{{ salerName }}</strong>
          </div>
        </div>
        <div class="summary-chip">
          <div class="summary-icon" aria-hidden="true">
            <Grid />
          </div>
          <div class="summary-copy">
            <span>物料数</span>
            <strong>{{ applyItems.length }}</strong>
          </div>
        </div>
        <div class="summary-graphic" aria-hidden="true">
          <span class="graphic-cube cube-a"></span>
          <span class="graphic-cube cube-b"></span>
          <span class="graphic-cube cube-c"></span>
          <span class="graphic-line line-a"></span>
          <span class="graphic-line line-b"></span>
        </div>
      </section>

      <section class="apply-table-card panel">
        <div class="section-head">
          <div class="section-title-wrap">
            <span class="section-icon" aria-hidden="true">
              <Tickets />
            </span>
            <div class="section-title">申请明细</div>
          </div>
          <!-- <div class="section-tip">每个商品显示库存余额，可直接调整申请数量</div> -->
        </div>

        <div class="table-scroll">
          <table class="apply-table">
            <thead>
              <tr>
                <th>商品</th>
                <th>规格</th>
                <th>库存余额</th>
                <th>申请数量</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in applyItems" :key="item.id">
                <td>
                  <div class="goods-cell">
                    <div class="goods-thumb">
                      <img v-if="item.image" :src="item.image" :alt="item.goodsName" />
                      <span v-else>{{ item.goodsName?.slice?.(0, 1) || "物" }}</span>
                    </div>
                    <div class="goods-name">{{ item.goodsName }}</div>
                  </div>
                </td>
                <td>{{ item.spec }}</td>
                <td :class="{ low: item.stockBalance <= 0 }">{{ formatStock(item.stockBalance) }}</td>
                <td>
                  <div class="stepper">
                    <button type="button" @click="changeQty(item, -1)">-</button>
                    <input :value="item.applyQty" @input="setQty(item, $event.target.value)" />
                    <button type="button" @click="changeQty(item, 1)">+</button>
                  </div>
                </td>
                <td>
                  <button class="remove-btn" type="button" @click="removeItem(item.id)">删除</button>
                </td>
              </tr>

              <tr v-if="!applyItems.length">
                <td colspan="5" class="empty-row">还没有选择物料</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="remark-block">
          <div class="remark-head">
            <label class="remark-label" for="material-remark">申请备注</label>
            <span class="remark-edit" aria-hidden="true">
              <EditPen />
            </span>
          </div>
          <div class="remark-shell">
            <textarea
              id="material-remark"
              v-model.trim="remark"
              maxlength="200"
              class="remark-input"
              placeholder="填写申请原因、用途或缺补货说明（选填）"
            />
            <div class="remark-count">{{ remark.length }}/200</div>
          </div>
        </div>
      </section>

      <section class="record-card panel">
        <div class="section-head">
          <div class="section-title-wrap">
            <span class="section-icon" aria-hidden="true">
              <Timer />
            </span>
            <div class="section-title">申请记录</div>
          </div>
        </div>

        <div class="record-filters">
          <div class="filter-row">
            <div class="filter-field">
              <label class="filter-label">商品名称</label>
              <input v-model="filterGoodsName" class="filter-input" placeholder="输入商品名称" @keydown.enter="searchRecords" />
            </div>
            <div class="filter-field">
              <label class="filter-label">申请备注</label>
              <input v-model="filterRemark" class="filter-input" placeholder="输入备注关键字" @keydown.enter="searchRecords" />
            </div>
            <div class="filter-field">
              <label class="filter-label">状态</label>
              <select v-model="filterStatus" class="filter-select">
                <option :value="0">全部</option>
                <option :value="1">待审核</option>
                <option :value="2">已出库</option>
                <option :value="3">已完成</option>
              </select>
            </div>
          </div>
          <div class="filter-row">
            <div class="filter-field">
              <label class="filter-label">开始时间</label>
              <input v-model="filterStartTime" type="date" class="filter-input" />
            </div>
            <div class="filter-field">
              <label class="filter-label">结束时间</label>
              <input v-model="filterEndTime" type="date" class="filter-input" />
            </div>
            <div class="filter-actions">
              <button class="filter-search-btn" type="button" :disabled="recordsLoading" @click="searchRecords">
                {{ recordsLoading ? "查询中..." : "查询" }}
              </button>
              <button class="filter-reset-btn" type="button" @click="resetFilters">重置</button>
            </div>
          </div>
        </div>

        <div v-if="recordsLoading" class="record-loading">加载中...</div>

        <div v-else>
          <div v-if="hasSearched" class="record-result-count">共找到 {{ totalRecords }} 条记录，第 {{ currentPage }} / {{ lastPage }} 页</div>

          <div v-if="applyRecords.length" class="record-list" ref="recordListRef">
          <article v-for="record in applyRecords" :key="record.id" class="record-item">
            <!-- 左侧：申请单信息 -->
            <div class="record-left">
              <div class="record-title">申请单 #{{ record.id }}</div>
              <div class="record-meta">{{ record.createdAt }} · 共 {{ record.items.length }} 项</div>
              <div v-if="record.remark" class="record-remark">备注：{{ record.remark }}</div>
            </div>

            <!-- 中间：商品列表 -->
            <div
              class="record-center"
              :class="{ 'record-center--expanded': isRecordExpanded(record) }"
            >
              <div
                v-for="(item, idx) in visibleRecordItems(record)"
                :key="`${record.id}_${idx}`"
                class="record-goods-row"
              >
                <div class="goods-thumb">
                  <img v-if="item.image" :src="item.image" :alt="item.goodsName" />
                  <span v-else>{{ item.goodsName?.slice?.(0, 1) || "物" }}</span>
                </div>
                <div class="record-goods-info">
                  <div class="record-goods-name">{{ item.goodsName }}</div>
                  <div class="record-goods-qty">
                    <span class="record-qty-chip strong">申请：{{ item.applyQty }}</span>
                    <span class="record-qty-chip">审核：{{ item.approveQty }}</span>
                  </div>
                </div>
              </div>
              <button
                v-if="record.items.length > 3"
                class="record-more-btn"
                type="button"
                @click="toggleRecordExpand(record)"
              >
                {{ isRecordExpanded(record) ? '收起' : `展开全部 (${record.items.length - 3})` }}
              </button>
            </div>

            <!-- 右侧：状态和操作 -->
            <div class="record-right">
              <span class="record-status" :class="getRecordStatusClass(record)">
                {{ getRecordStatusText(record) }}
              </span>
              <button
                v-if="canCompleteRecord(record)"
                class="record-confirm-btn"
                type="button"
                :disabled="isCompletingRecord(record)"
                @click="confirmRecordReceipt(record)"
              >
                {{ isCompletingRecord(record) ? "确认中..." : "确认收货" }}
              </button>
            </div>
          </article>
          </div>

          <div v-if="lastPage > 1" class="pager">
            <button class="pager-btn" type="button" :disabled="currentPage <= 1" @click="changePage(currentPage - 1)">上一页</button>
            <button
              v-for="p in pageNumbers"
              :key="p"
              class="pager-num"
              type="button"
              :class="{ active: p === currentPage }"
              @click="changePage(p)"
            >{{ p }}</button>
            <button class="pager-btn" type="button" :disabled="currentPage >= lastPage" @click="changePage(currentPage + 1)">下一页</button>
          </div>

          <div v-if="!applyRecords.length" class="record-empty">{{ hasSearched ? "未找到符合条件的记录" : "暂无物料申请记录" }}</div>
        </div>
      </section>
    </main>

    <ProductLibraryModal
      title="选择申请物料"
      :visible="libraryVisible"
      :loading="libraryLoading"
      :categories="categories"
      :active-category-id="activeCategoryId"
      :goods="libraryGoods"
      :selected-ids="selectedGoodsIds"
      @close="closeLibrary"
      @confirm="confirmLibrarySelection"
      @change-category="changeCategory"
      @toggle="toggleLibraryGoods"
      @search="searchGoodsByName"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Box, House, User, Grid, Tickets, EditPen, Timer } from "@element-plus/icons-vue";
import AppHeader from "../components/AppHeader.vue";
import ProductLibraryModal from "../components/ProductLibraryModal.vue";
import { api, authStore, getErrorMessage } from "../services/api.js";

const MATERIAL_APPLY_DRAFT_KEY = "ny_cashier_material_apply_draft";

const categories = ref([{ id: 0, name: "全部" }]);
const activeCategoryId = ref(0);
const libraryGoods = ref([]);
const selectedGoodsIds = ref([]);
const libraryVisible = ref(false);
const libraryLoading = ref(false);
const applyItems = ref([]);
const applyRecords = ref([]);
const remark = ref("");
const submitting = ref(false);
const completingIds = ref([]);
const notice = ref(null);
let noticeTimer = 0;

function showNotice(text, type = "info") {
  notice.value = { text, type };
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => {
    notice.value = null;
  }, 2400);
}

const recordsLoading = ref(false);
const filterGoodsName = ref("");
const filterRemark = ref("");
const filterStatus = ref(0);
const filterStartTime = ref("");
const filterEndTime = ref("");
const hasSearched = ref(false);
const expandedRecordIds = ref([]);
const currentPage = ref(1);
const lastPage = ref(1);
const totalRecords = ref(0);
const pageSize = ref(10);
const recordListRef = ref(null);

const shopName = computed(() => authStore.getCachedUser()?.shopname || "当前门店");
const salerName = computed(() => authStore.getCachedSaler()?.salerName || "");

function getStock(goods = {}) {
  return Number(goods.shopStock ?? goods.stock ?? 0) || 0;
}

function formatStock(value) {
  return Number(value || 0).toFixed(2).replace(/\.00$/, "");
}

function mapApplyItem(goods = {}) {
  return {
    ...goods,
    stockBalance: getStock(goods),
    applyQty: Math.max(Number(goods.applyQty || 1) || 1, 1)
  };
}

async function loadCatalog(typeId = 0) {
  libraryLoading.value = true;
  try {
    const result = await api.fetchCatalog({ typeId, keyword: "", page: 1 });
    categories.value = result.categories.length ? result.categories : [{ id: 0, name: "全部" }];
    libraryGoods.value = result.goodsPage.list;
  } catch (error) {
    showNotice(getErrorMessage(error, "商品列表加载失败"), "error");
  } finally {
    libraryLoading.value = false;
  }
}

async function loadCategoryGoods(typeId) {
  libraryLoading.value = true;
  try {
    const result = await api.fetchGoods({ typeId, keyword: "", page: 1 });
    libraryGoods.value = result.list;
  } catch (error) {
    showNotice(getErrorMessage(error, "分类商品加载失败"), "error");
  } finally {
    libraryLoading.value = false;
  }
}

async function searchGoodsByName(keyword) {
  if (!keyword) {
    loadCatalog(activeCategoryId.value);
    return;
  }
  libraryLoading.value = true;
  try {
    const result = await api.searchGoods(keyword);
    libraryGoods.value = result.list;
  } catch (error) {
    showNotice(getErrorMessage(error, "商品搜索失败"), "error");
  } finally {
    libraryLoading.value = false;
  }
}

function openLibrary() {
  selectedGoodsIds.value = applyItems.value.map((item) => item.id);
  libraryVisible.value = true;
  if (!libraryGoods.value.length) {
    loadCatalog(activeCategoryId.value);
  }
}

function closeLibrary() {
  libraryVisible.value = false;
  selectedGoodsIds.value = [];
  loadCatalog(activeCategoryId.value);
}

function toggleLibraryGoods(item) {
  if (selectedGoodsIds.value.includes(item.id)) {
    selectedGoodsIds.value = selectedGoodsIds.value.filter((id) => id !== item.id);
    return;
  }
  selectedGoodsIds.value = [...selectedGoodsIds.value, item.id];
}

function confirmLibrarySelection() {
  const selectedGoods = libraryGoods.value.filter((item) => selectedGoodsIds.value.includes(item.id));
  const nextMap = new Map(applyItems.value.map((item) => [item.id, item]));

  selectedGoods.forEach((item) => {
    const current = nextMap.get(item.id);
    nextMap.set(item.id, current ? mapApplyItem({ ...item, applyQty: current.applyQty }) : mapApplyItem(item));
  });

  applyItems.value = Array.from(nextMap.values());
  closeLibrary();
}

async function changeCategory(category) {
  activeCategoryId.value = category.id;
  selectedGoodsIds.value = [];
  await loadCategoryGoods(category.id);
}

function changeQty(item, delta) {
  const nextQty = Math.max(1, Number(item.applyQty || 1) + delta);
  item.applyQty = nextQty;
}

function setQty(item, value) {
  const nextQty = Math.max(1, Number(value || 1) || 1);
  item.applyQty = nextQty;
}

function removeItem(id) {
  applyItems.value = applyItems.value.filter((item) => item.id !== id);
}

function restoreDraft() {
  const raw = window.sessionStorage.getItem(MATERIAL_APPLY_DRAFT_KEY);
  if (!raw) {
    return;
  }

  try {
    const list = JSON.parse(raw);
    applyItems.value = Array.isArray(list) ? list.map((item) => mapApplyItem(item)) : [];
  } catch (error) {
    applyItems.value = [];
  } finally {
    window.sessionStorage.removeItem(MATERIAL_APPLY_DRAFT_KEY);
  }
}

async function loadApplyRecords(page = 1) {
  recordsLoading.value = true;
  try {
    const result = await api.fetchApplyList({
      goodsName: filterGoodsName.value,
      remark: filterRemark.value,
      status: filterStatus.value,
      starttime: filterStartTime.value,
      endtime: filterEndTime.value,
      page
    });
    applyRecords.value = result.list;
    currentPage.value = result.page || page;
    lastPage.value = result.lastPage || 1;
    totalRecords.value = result.total || 0;
    pageSize.value = result.pageSize || 10;
    hasSearched.value = true;
  } catch (error) {
    showNotice(getErrorMessage(error, "申请记录加载失败"), "error");
  } finally {
    recordsLoading.value = false;
  }
}

function changePage(page) {
  const target = Math.min(Math.max(1, Number(page) || 1), lastPage.value);
  if (target === currentPage.value) return;
  loadApplyRecords(target).then(() => {
    recordListRef.value?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

const pageNumbers = computed(() => {
  const total = lastPage.value;
  const cur = currentPage.value;
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const windowSize = 5;
  let start = Math.max(1, cur - Math.floor(windowSize / 2));
  let end = start + windowSize - 1;
  if (end > total) {
    end = total;
    start = Math.max(1, end - windowSize + 1);
  }
  const nums = [];
  for (let i = start; i <= end; i++) nums.push(i);
  return nums;
});

function searchRecords() {
  loadApplyRecords(1);
}

function resetFilters() {
  filterGoodsName.value = "";
  filterRemark.value = "";
  filterStatus.value = 0;
  filterStartTime.value = "";
  filterEndTime.value = "";
  loadApplyRecords(1);
}

function isRecordExpanded(record) {
  return expandedRecordIds.value.includes(String(record.id));
}

function toggleRecordExpand(record) {
  const id = String(record.id);
  if (expandedRecordIds.value.includes(id)) {
    expandedRecordIds.value = expandedRecordIds.value.filter((r) => r !== id);
  } else {
    expandedRecordIds.value = [...expandedRecordIds.value, id];
  }
}

function visibleRecordItems(record) {
  if (!record.items?.length) return [];
  if (isRecordExpanded(record)) return record.items;
  return record.items.slice(0, 3);
}

function getRecordStatusKey(record = {}) {
  const s = Number(record.status);
  if (s === 1) return "applying";
  if (s === 2) return "delivering";
  if (s === 3) return "completed";
  return "applying";
}

function getRecordStatusText(record = {}) {
  return record.statusText || ({ 1: "待审核", 2: "已出库", 3: "已完成" }[Number(record.status)] || "待审核");
}

function getRecordStatusClass(record = {}) {
  return `status-${getRecordStatusKey(record)}`;
}

function canCompleteRecord(record = {}) {
  return Number(record.status) === 2;
}

function isCompletingRecord(record = {}) {
  return completingIds.value.includes(String(record.id));
}

function buildApplyPayload() {
  const goods = applyItems.value
    .map((item) => ({
      goodsId: Number(item.id || 0),
      nums: Math.max(1, Number(item.applyQty || 1) || 1)
    }))
    .filter((item) => item.goodsId > 0);

  if (!goods.length) {
    throw new Error("请选择要申请的物料");
  }

  return {
    remark: remark.value || "",
    goods
  };
}

async function submitApply() {
  if (!applyItems.value.length || submitting.value) {
    return;
  }

  try {
    const payload = buildApplyPayload();
    submitting.value = true;
    await api.goodsApply(payload);
    applyItems.value = [];
    remark.value = "";
    showNotice("申请成功", "success");
    loadApplyRecords();
  } catch (error) {
    showNotice(getErrorMessage(error, "申请失败"), "error");
  } finally {
    submitting.value = false;
  }
}

async function confirmRecordReceipt(record) {
  const applyId = Number(record?.id || 0);
  if (!applyId) {
    showNotice("申请单缺少ID，暂时无法确认收货", "error");
    return;
  }
  if (isCompletingRecord(record)) {
    return;
  }

  completingIds.value = [...completingIds.value, String(record.id)];
  try {
    await api.completeApply(applyId);
    showNotice("确认收货成功", "success");
    loadApplyRecords();
  } catch (error) {
    showNotice(getErrorMessage(error, "确认收货失败"), "error");
  } finally {
    completingIds.value = completingIds.value.filter((id) => id !== String(record.id));
  }
}

onMounted(() => {
  restoreDraft();
  loadApplyRecords();
  loadCatalog(0);
});

onBeforeUnmount(() => {
  window.clearTimeout(noticeTimer);
});
</script>

<style scoped>
.material-main {
  padding: 22px 28px 36px;
  background:
    radial-gradient(circle at top left, rgba(88, 130, 255, 0.08), transparent 28%),
    linear-gradient(180deg, #f4f7fc 0%, #eef3fa 100%);
}

.apply-hero,
.apply-summary,
.apply-table-card {
  background: rgba(255, 255, 255, 0.96);
}

.apply-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px;
  border: 1px solid #e5edf8;
  border-radius: 22px;
  box-shadow: 0 12px 32px rgba(52, 82, 160, 0.08);
}

.apply-hero-main {
  display: flex;
  align-items: center;
  gap: 18px;
}

.apply-hero-icon {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #4d86ff 0%, #2f5ff1 100%);
  color: #ffffff;
  font-size: 22px;
  box-shadow: 0 14px 26px rgba(52, 96, 255, 0.22);
}

.apply-hero-icon svg,
.summary-icon svg,
.section-icon svg,
.remark-edit svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

.apply-title {
  color: #14213d;
  font-size: 22px;
  font-weight: 800;
}

.apply-subtitle {
  margin-top: 6px;
  color: #7c8aa5;
  font-size: 14px;
}

.apply-hero-actions {
  display: inline-flex;
  gap: 14px;
}

.pick-btn,
.submit-btn,
.remove-btn {
  font-weight: 700;
}

.pick-btn,
.submit-btn {
  min-width: 128px;
  height: 48px;
  padding: 0 20px;
  border-radius: 14px;
  font-size: 16px;
}

.pick-btn {
  border: 1px solid #dce4f1;
  background: #ffffff;
  color: #3e5fd3;
  box-shadow: 0 10px 22px rgba(49, 92, 240, 0.06);
}

.submit-btn {
  border: 1px solid #315cf0;
  background: linear-gradient(135deg, #4f87ff 0%, #315cf0 100%);
  color: #ffffff;
  box-shadow: 0 18px 30px rgba(49, 92, 240, 0.22);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.apply-summary {
  position: relative;
  margin-top: 18px;
  display: flex;
  gap: 16px;
  padding: 18px 180px 18px 10px;
  border: 1px solid #e5edf8;
  border-radius: 22px;
  box-shadow: 0 12px 32px rgba(52, 82, 160, 0.06);
  overflow: hidden;
}

.summary-chip {
  min-width: 0;
  flex: 1;
  padding: 16px 18px;
  border: 1px solid #e7edf6;
  border-radius: 16px;
  background: #ffffff;
  display: flex;
  align-items: center;
  gap: 14px;
}

.summary-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #eef4ff;
  color: #4973f5;
  font-size: 20px;
  flex: none;
}

.summary-copy {
  min-width: 0;
}

.summary-copy span {
  display: block;
  color: #7a879f;
  font-size: 13px;
}

.summary-copy strong {
  display: block;
  margin-top: 8px;
  color: #1a2746;
  font-size: 18px;
}

.summary-graphic {
  position: absolute;
  right: 18px;
  top: 8px;
  bottom: 8px;
  width: 260px;
  pointer-events: none;
  opacity: 0.62;
}

.graphic-cube,
.graphic-line {
  position: absolute;
}

.graphic-cube {
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(240, 245, 255, 0.92) 0%, rgba(229, 237, 255, 0.86) 100%);
  border: 1px solid rgba(214, 226, 250, 0.9);
}

.cube-a {
  right: 20px;
  top: 8px;
  width: 52px;
  height: 52px;
}

.cube-b {
  right: 86px;
  top: 34px;
  width: 42px;
  height: 42px;
}

.cube-c {
  right: 136px;
  top: 52px;
  width: 34px;
  height: 34px;
}

.graphic-line {
  height: 1px;
  background: linear-gradient(90deg, rgba(214, 226, 250, 0.2), rgba(214, 226, 250, 0.95));
}

.line-a {
  left: 22px;
  right: 54px;
  top: 70px;
}

.line-b {
  left: 64px;
  right: 94px;
  top: 30px;
}

.apply-table-card {
  margin-top: 16px;
  overflow: hidden;
  padding: 0;
  border: 1px solid #e5edf8;
  border-radius: 22px;
  box-shadow: 0 14px 34px rgba(52, 82, 160, 0.06);
}

.record-card {
  margin-top: 16px;
  padding: 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #e5edf8;
  border-radius: 22px;
  box-shadow: 0 14px 34px rgba(52, 82, 160, 0.06);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 22px 14px;
}

.section-title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.section-icon {
  color: #4d78ff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  line-height: 1;
}

.section-title {
  color: #17233f;
  font-size: 18px;
  font-weight: 800;
}

.section-tip {
  color: var(--text-muted);
  font-size: 14px;
}

.table-scroll {
  overflow: auto;
}

.apply-table {
  width: 100%;
  min-width: 880px;
  border-collapse: collapse;
}

.apply-table th,
.apply-table td {
  padding: 18px 16px;
  border-top: 1px solid #edf2f8;
  text-align: center;
}

.apply-table th {
  color: #3e4b65;
  font-size: 16px;
  font-weight: 700;
}

.goods-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}

.goods-thumb {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  border: 1px solid #e6ebf5;
  background: #f8fbff;
  overflow: hidden;
  display: grid;
  place-items: center;
  flex: none;
  color: #7b89a3;
  font-size: 16px;
  font-weight: 700;
}

.goods-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.goods-name {
  color: var(--text-strong);
  font-weight: 700;
  text-align: left;
  font-size: 14px;
  line-height: 1.45;
  white-space: normal;
  word-break: break-all;
}

.low {
  color: #d53b31;
  font-weight: 800;
}

.stepper {
  display: inline-flex;
  align-items: center;
  border: 1px solid #dce4f1;
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
}

.stepper button,
.stepper input {
  width: 38px;
  height: 38px;
  border: none;
  background: #ffffff;
  text-align: center;
  color: #354258;
}

.stepper input {
  width: 60px;
  border-left: 1px solid #edf2f8;
  border-right: 1px solid #edf2f8;
  outline: none;
}

.remove-btn {
  border: none;
  background: transparent;
  color: #4d73d8;
}

.empty-row {
  color: var(--text-muted);
}

.remark-block {
  padding: 14px 22px 18px;
  border-top: 1px solid #edf2f8;
}

.remark-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.remark-label {
  display: block;
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 700;
}

.remark-edit {
  color: #4b74f1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.remark-shell {
  position: relative;
  margin-top: 10px;
}

.remark-input {
  width: 100%;
  min-height: 58px;
  border: 1px solid #dbe4f1;
  border-radius: 16px;
  padding: 16px 16px 28px;
  resize: vertical;
  outline: none;
  font: inherit;
  color: #2a3650;
  box-sizing: border-box;
}

.remark-count {
  position: absolute;
  right: 16px;
  bottom: 10px;
  color: #95a0b6;
  font-size: 12px;
}

.record-list {
  padding: 0 22px 18px;
  display: grid;
  gap: 14px;
}

.record-item {
  display: grid;
  grid-template-columns: 200px 1fr auto;
  gap: 18px;
  align-items: flex-start;
  border: 1px solid #e7edf6;
  border-radius: 18px;
  background: #fbfcff;
  padding: 18px 20px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
  transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}

.record-item:hover {
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.1);
  transform: translateY(-2px);
  border-color: #cddafc;
}

.record-item:has(.status-completed) {
  background: rgba(22, 163, 74, 0.06);
  border-color: rgba(22, 163, 74, 0.15);
}

.record-item:has(.status-delivering) {
  background: rgba(245, 158, 11, 0.05);
  border-color: rgba(245, 158, 11, 0.15);
}

.record-left {
  min-width: 0;
}

.record-center {
  min-width: 0;
  display: flex;
  flex-direction: row;
  gap: 10px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  padding-bottom: 4px;
}

.record-center--expanded {
  flex-direction: column;
  overflow-x: visible;
  padding-bottom: 0;
}

.record-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  flex: none;
}

.record-title {
  color: var(--text-strong);
  font-size: 16px;
  font-weight: 800;
}

.record-meta {
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 13px;
}

.record-remark {
  margin-top: 8px;
  color: #475467;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-all;
}

.record-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 74px;
  height: 28px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.record-status.status-applying {
  background: rgba(79, 135, 255, 0.12);
  color: #315cf0;
}

.record-status.status-rejected {
  background: rgba(213, 59, 49, 0.12);
  color: #d53b31;
}

.record-status.status-delivering {
  background: rgba(245, 158, 11, 0.18);
  color: #b7791f;
}

.record-status.status-completed {
  background: rgba(22, 163, 74, 0.14);
  color: #16a34a;
}

.record-confirm-btn {
  min-width: 84px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid #315cf0;
  border-radius: 999px;
  background: #ffffff;
  color: #315cf0;
  font-size: 12px;
  font-weight: 700;
}

.record-confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.record-goods-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid #e8edf5;
  border-radius: 12px;
  background: #ffffff;
  flex: none;
  min-width: 240px;
}

.record-center--expanded .record-goods-row {
  flex: auto;
  min-width: 0;
}

.record-goods-info {
  min-width: 0;
  flex: 1;
}

.record-goods-name {
  color: var(--text-strong);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
  word-break: break-all;
}

.record-goods-qty {
  margin-top: 4px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.record-qty-chip {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: #f5f7fb;
  color: #5b6477;
  font-size: 12px;
  white-space: nowrap;
}

.record-qty-chip.strong {
  background: #eef4ff;
  color: #315cf0;
  font-weight: 700;
}

.record-more-btn {
  border: none;
  background: transparent;
  color: #558cff;
  font-size: 13px;
  font-weight: 700;
  padding: 4px 0;
  align-self: flex-start;
}

.record-empty {
  padding: 0 22px 18px;
  color: var(--text-muted);
}

.record-loading {
  padding: 32px 22px;
  text-align: center;
  color: #7c8aa5;
  font-size: 14px;
}

.record-result-count {
  padding: 10px 22px 0;
  color: #5b6477;
  font-size: 13px;
  font-weight: 600;
}

.pager {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 14px 22px 20px;
}

.pager-btn,
.pager-num {
  min-width: 38px;
  height: 34px;
  padding: 0 12px;
  border: 1px solid #d7e0eb;
  border-radius: 9px;
  background: #ffffff;
  color: #3a4356;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.16s ease, color 0.16s ease, background 0.16s ease;
}

.pager-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pager-num.active {
  border-color: #4f87ff;
  background: #4f87ff;
  color: #ffffff;
  font-weight: 700;
}

.pager-btn:not(:disabled):hover,
.pager-num:not(.active):hover {
  border-color: #4f87ff;
  color: #4f87ff;
}

.record-filters {
  padding: 16px 22px 18px;
  border-top: 1px solid #edf2f8;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.filter-label {
  font-size: 12px;
  font-weight: 700;
  color: #5b6477;
}

.filter-input,
.filter-select {
  height: 36px;
  padding: 0 12px;
  border: 1px solid #dce4f1;
  border-radius: 10px;
  background: #ffffff;
  color: #2a3650;
  font-size: 14px;
  outline: none;
  transition: border-color 0.18s ease;
  box-sizing: border-box;
  width: 100%;
}

.filter-input:focus,
.filter-select:focus {
  border-color: #4d78ff;
}

.filter-actions {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.filter-search-btn,
.filter-reset-btn {
  height: 36px;
  padding: 0 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.filter-search-btn {
  border: 1px solid #315cf0;
  background: linear-gradient(135deg, #4f87ff 0%, #315cf0 100%);
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(49, 92, 240, 0.18);
}

.filter-search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filter-reset-btn {
  border: 1px solid #dce4f1;
  background: #ffffff;
  color: #5b6477;
}

@media (max-width: 960px) {
  .apply-hero,
  .apply-summary,
  .section-head {
    flex-direction: column;
    align-items: stretch;
  }

  .apply-summary {
    padding: 18px;
  }

  .summary-chip {
    min-width: 0;
  }

  .summary-graphic {
    display: none;
  }

  .apply-hero-actions {
    width: 100%;
  }

  .pick-btn,
  .submit-btn {
    flex: 1;
  }

  .record-item {
    grid-template-columns: 1fr;
  }

  .record-right {
    align-items: flex-start;
  }

  .filter-row {
    flex-direction: column;
  }

  .filter-field {
    width: 100%;
  }
}

.notice-banner {
  position: fixed;
  left: 50%;
  top: 20px;
  z-index: 90;
  transform: translateX(-50%);
  min-width: 240px;
  max-width: 80vw;
  padding: 22px 32px;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  line-height: 1.5;
  box-shadow: 0 14px 44px rgba(0, 0, 0, 0.25);
  animation: notice-pop 0.18s ease-out;
}

@keyframes notice-pop {
  from {
    opacity: 0;
    transform: translate(-50%, -8px) scale(0.94);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}

.notice-banner.info {
  background: rgba(18, 63, 113, 0.95);
  color: #ffffff;
}

.notice-banner.success {
  background: rgba(38, 145, 74, 0.95);
  color: #ffffff;
}

.notice-banner.error {
  background: rgba(229, 57, 53, 0.95);
  color: #ffffff;
}
</style>
