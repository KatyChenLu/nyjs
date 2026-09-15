<template>
  <div v-if="visible" class="modal-mask" @click.self="$emit('close')">
    <div class="modal-card">
      <aside class="category-list">
        <button
          v-for="category in categories"
          :key="category.id"
          class="category-item"
          :class="{ active: activeCategoryId === category.id, 'is-child': category.depth > 0 }"
          :style="category.depth > 0 ? { paddingLeft: `${14 + category.depth * 16}px` } : {}"
          type="button"
          @click="$emit('change-category', category)"
        >
          {{ category.name }}
        </button>
      </aside>

      <section class="goods-pane">
        <div class="modal-toolbar">
          <div class="modal-heading">
            <div class="modal-title">{{ title }}</div>
            <div class="modal-subtitle">已选 {{ selectedIds.length }} 件</div>
          </div>

          <div class="modal-search">
            <input
              v-model.trim="filterKeyword"
              class="modal-search-input"
              placeholder="搜索商品名称"
              @input="onSearchInput"
            />
            <span class="modal-search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="presentation">
                <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z" />
              </svg>
            </span>
          </div>

          <button
            v-if="showApplyAction"
            class="apply-btn"
            type="button"
            @click="$emit('apply-action')"
          >
            {{ applyActionLabel }}
          </button>
        </div>

        <div class="goods-grid">
          <button
            v-for="item in goods"
            :key="item.id"
            class="goods-card"
            :class="{ selected: selectedIds.includes(item.id) }"
            type="button"
            @click="$emit('toggle', item)"
          >
            <img class="goods-image" :src="item.image" :alt="item.goodsName" />
            <div class="goods-copy">
              <div class="goods-name">{{ item.goodsName }}</div>
              <div class="goods-spec">{{ item.spec }}</div>
              <div class="goods-stock" :class="{ low: getStock(item) <= 0 }">
                库存余额 {{ formatStock(getStock(item)) }}
              </div>
              <div class="goods-price money">¥{{ formatMoney(item.salePrice) }}</div>
            </div>
            <div class="select-dot">{{ selectedIds.includes(item.id) ? "✓" : "" }}</div>
          </button>
        </div>

        <div v-if="!goods.length && !loading" class="empty-state">当前分类下没有商品</div>

        <div class="modal-actions">
          <button class="ghost-btn" type="button" @click="$emit('close')">取消</button>
          <button class="primary-btn" type="button" @click="$emit('confirm')">确认</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { formatMoney } from "../services/api.js";

const props = defineProps({
  title: {
    type: String,
    default: "快捷选择"
  },
  visible: Boolean,
  loading: Boolean,
  categories: {
    type: Array,
    default: () => []
  },
  activeCategoryId: {
    type: Number,
    default: 0
  },
  goods: {
    type: Array,
    default: () => []
  },
  selectedIds: {
    type: Array,
    default: () => []
  },
  showApplyAction: {
    type: Boolean,
    default: false
  },
  applyActionLabel: {
    type: String,
    default: "物料申请"
  }
});

const emit = defineEmits(["close", "confirm", "change-category", "toggle", "apply-action", "search"]);

const filterKeyword = ref("");

let searchTimer = 0;
function onSearchInput() {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    emit("search", filterKeyword.value);
  }, 300);
}

// 弹窗关闭时清空搜索关键词
watch(() => props.visible, (val) => {
  if (!val) {
    filterKeyword.value = "";
  }
});

function getStock(item = {}) {
  return Number(item.shopStock ?? item.stock ?? 0) || 0;
}

function formatStock(value) {
  return Number(value || 0).toFixed(2).replace(/\.00$/, "");
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(9, 23, 41, 0.55);
  backdrop-filter: blur(6px);
}

.modal-card {
  width: min(1480px, 100%);
  height: min(850px, calc(100vh - 36px));
  display: flex;
  overflow: hidden;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 28px 80px rgba(8, 24, 42, 0.2);
}

.category-list {
  width: 180px;
  background: #f8fafc;
  border-right: 1px solid #e8eef7;
  overflow: auto;
}

.category-item {
  width: 100%;
  min-height: 72px;
  border: none;
  border-bottom: 1px solid #eef2f7;
  background: #ffffff;
  color: #1e293b;
  font-size: 15px;
  font-weight: 700;
  text-align: left;
  padding-left: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 0.15s ease;
}

.category-item.is-child {
  font-size: 13px;
  font-weight: 500;
  min-height: 48px;
  color: #94a3b8;
  background: #f8fafc;
  border-bottom-color: #f1f5f9;
  border-left: 2px solid transparent;
}

.category-item.active {
  background: linear-gradient(135deg, #4f87ff 0%, #315cf0 100%);
  color: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.goods-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.modal-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 24px 0;
  background: #ffffff;
}

.modal-heading {
  min-width: 0;
}

.modal-title {
  color: var(--text-strong);
  font-size: 22px;
  font-weight: 800;
}

.modal-subtitle {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 600;
}

.apply-btn {
  flex: none;
  min-width: 124px;
  height: 46px;
  padding: 0 18px;
  border: 1px solid #d8e2f2;
  border-radius: 14px;
  background: linear-gradient(135deg, #f4f8ff 0%, #ecf2ff 100%);
  color: #2850c8;
  font-size: 15px;
  font-weight: 800;
  box-shadow: 0 12px 24px rgba(79, 135, 255, 0.12);
}

.modal-search {
  position: relative;
  flex: 1;
  max-width: 320px;
}

.modal-search-input {
  width: 100%;
  height: 46px;
  padding: 0 44px 0 16px;
  border: 1px solid #d7e0eb;
  border-radius: 14px;
  background: #f8fafd;
  color: #1a1f2e;
  font-size: 15px;
  font-weight: 600;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.modal-search-input::placeholder {
  color: #94a0ba;
  font-weight: 500;
}

.modal-search-input:focus {
  border-color: #4f87ff;
  box-shadow: 0 0 0 3px rgba(79, 135, 255, 0.12);
  background: #ffffff;
}

.modal-search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  color: #94a0ba;
  pointer-events: none;
}

.modal-search-icon svg {
  width: 100%;
  height: 100%;
  fill: currentColor;
}

.goods-grid {
  flex: 1;
  padding: 20px 24px 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  grid-auto-rows: minmax(150px, auto);
  align-content: start;
  gap: 18px;
  overflow: auto;
  background: #ffffff;
}

.goods-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 150px;
  padding: 18px;
  border-radius: 16px;
  border: 1px solid #d7e0eb;
  background: #ffffff;
  text-align: left;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.goods-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.goods-card.selected {
  border-color: #4f87ff;
  box-shadow: 0 16px 30px rgba(79, 135, 255, 0.16);
}

.goods-image {
  width: 88px;
  height: 88px;
  border-radius: 14px;
  object-fit: cover;
  background: #f3f6fa;
}

.goods-copy {
  min-width: 0;
  flex: 1;
  align-self: center;
}

.goods-name {
  color: var(--text-strong);
  font-size: 16px;
  font-weight: 800;
  line-height: 1.4;
  white-space: normal;
  word-break: break-all;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.goods-spec {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 14px;
}

.goods-stock {
  margin-top: 8px;
  color: #1f7a45;
  font-size: 14px;
  font-weight: 700;
}

.goods-stock.low {
  color: #d53b31;
}

.goods-price {
  margin-top: 8px;
  color: #d53b31;
  font-size: 20px;
  font-weight: 800;
}

.select-dot {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid #d6dee8;
  display: grid;
  place-items: center;
  color: #ffffff;
  font-size: 18px;
  font-weight: 800;
}

.selected .select-dot {
  border-color: #4f87ff;
  background: linear-gradient(135deg, #4f87ff 0%, #315cf0 100%);
}

.empty-state {
  padding: 0 24px 18px;
  color: var(--text-muted);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  padding: 18px 24px 22px;
  border-top: 1px solid #eef2f7;
  background: #fcfdff;
}

.modal-actions .primary-btn {
  background: linear-gradient(135deg, #4f87ff 0%, #315cf0 100%);
  color: #ffffff;
  box-shadow: 0 16px 28px rgba(49, 92, 240, 0.22);
}

@media (max-width: 920px) {
  .modal-card {
    flex-direction: column;
  }

  .category-list {
    width: 100%;
    display: flex;
  }

  .category-item {
    min-width: 140px;
    min-height: 62px;
    border-bottom: none;
    border-right: 1px solid #eef2f7;
  }

  .modal-toolbar {
    padding-top: 16px;
  }
}

@media (max-width: 640px) {
  .modal-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .apply-btn {
    width: 100%;
  }

  .goods-grid {
    grid-template-columns: 1fr;
  }
}
</style>
