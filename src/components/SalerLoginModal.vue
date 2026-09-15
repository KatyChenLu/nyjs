<template>
  <div v-if="visible" class="saler-mask" @click.self="$emit('close')">
    <div class="saler-card">
      <header class="saler-head">
        <div class="saler-head-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.69-8 6v2h16v-2c0-3.31-3.58-6-8-6Z" />
          </svg>
        </div>
        <div>
          <div class="saler-title">店员登录 / 切换</div>
          <div class="saler-subtitle">选择店员并输入密码完成登录</div>
          <div v-if="shopName" class="saler-shop">{{ shopName }}</div>
        </div>
        <button class="saler-close" type="button" aria-label="关闭" @click="$emit('close')">×</button>
      </header>

      <div v-if="currentSaler" class="saler-current">
        <span class="saler-current-dot" />
        <span>当前店员：<strong>{{ currentSaler.salerName }}</strong>（{{ currentSaler.salerNo }}）</span>
        <button class="saler-clear" type="button" @click="clearSaler">退出</button>
      </div>

      <div class="saler-body">
        <div class="saler-section-label">选择店员</div>
        <div v-if="loadingList" class="saler-hint">店员列表加载中…</div>
        <div v-else-if="!salers.length" class="saler-hint">暂无可登录的店员</div>
        <div class="saler-list">
          <button
            v-for="item in salers"
            :key="item.id"
            class="saler-item"
            :class="{ active: selectedId === item.id }"
            type="button"
            @click="selectSaler(item)"
          >
            <span class="saler-item-name">{{ item.salerName || "未命名" }}</span>
            <span class="saler-item-no">{{ item.salerNo }}</span>
          </button>
        </div>

        <div class="saler-section-label">登录密码</div>
        <input
          v-model.trim="password"
          class="field saler-input"
          type="password"
          placeholder="请输入店员登录密码"
          :disabled="!selectedId || submitting"
          @keyup.enter="submit"
        />

        <p v-if="errorMessage" class="saler-error">{{ errorMessage }}</p>
      </div>

      <footer class="saler-actions">
        <button class="ghost-btn" type="button" :disabled="submitting" @click="$emit('close')">取消</button>
        <button
          class="primary-btn"
          type="button"
          :disabled="submitting || !selectedId || !password"
          @click="submit"
        >
          {{ submitting ? "登录中…" : "登录" }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { api, authStore, getErrorMessage } from "../services/api.js";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["close", "confirm"]);

const salers = ref([]);
const loadingList = ref(false);
const selectedId = ref(0);
const password = ref("");
const submitting = ref(false);
const errorMessage = ref("");

const currentSaler = computed(() => authStore.getCachedSaler());

const shopName = computed(() => authStore.getCachedUser()?.shopname || "");

watch(() => props.visible, (val) => {
  errorMessage.value = "";
  password.value = "";
  if (val) {
    loadSalers();
  }
});

async function loadSalers() {
  loadingList.value = true;
  try {
    salers.value = await api.fetchSalerList();
  } catch (error) {
    errorMessage.value = getErrorMessage(error, "店员列表加载失败");
    salers.value = [];
  } finally {
    loadingList.value = false;
  }
}

function selectSaler(item) {
  selectedId.value = item.id;
  errorMessage.value = "";
}

function clearSaler() {
  authStore.clearSaler();
  selectedId.value = 0;
  password.value = "";
  emit("confirm");
}

async function submit() {
  if (!selectedId.value || !password.value) {
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    const saler = await api.salerLogin({
      salerId: selectedId.value,
      password: password.value
    });
    emit("confirm", saler);
    emit("close");
  } catch (error) {
    errorMessage.value = getErrorMessage(error, "店员登录失败");
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.saler-mask {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(9, 23, 41, 0.55);
  backdrop-filter: blur(6px);
}

.saler-card {
  width: min(440px, 100%);
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 28px 80px rgba(8, 24, 42, 0.2);
}

.saler-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 22px 16px;
  border-bottom: 1px solid #eef2f7;
}

.saler-head-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  flex: none;
  background: linear-gradient(135deg, #4f87ff 0%, #315cf0 100%);
  display: grid;
  place-items: center;
}

.saler-head-icon svg {
  width: 26px;
  height: 26px;
  fill: #ffffff;
}

.saler-title {
  color: var(--text-strong);
  font-size: 19px;
  font-weight: 800;
}

.saler-subtitle {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 13px;
}

.saler-shop {
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(79, 135, 255, 0.1);
  color: #315cf0;
  font-size: 12px;
  font-weight: 700;
}

.saler-close {
  margin-left: auto;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 12px;
  background: #f2f5f9;
  color: #667085;
  font-size: 22px;
  line-height: 1;
}

.saler-close:hover {
  background: #e7ecf3;
}

.saler-current {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 14px 22px 0;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(22, 163, 74, 0.06);
  color: #475467;
  font-size: 14px;
}

.saler-current-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #16a34a;
  flex: none;
}

.saler-clear {
  margin-left: auto;
  border: none;
  background: transparent;
  color: #d53b31;
  font-size: 13px;
  font-weight: 700;
}

.saler-body {
  padding: 16px 22px 6px;
  overflow: auto;
}

.saler-section-label {
  margin: 8px 0 10px;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 700;
}

.saler-hint {
  padding: 14px 0;
  color: var(--text-muted);
  font-size: 14px;
}

.saler-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.saler-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 12px 14px;
  border: 1px solid #d7e0eb;
  border-radius: 14px;
  background: #ffffff;
  text-align: left;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.saler-item:hover {
  border-color: #9cc0ff;
}

.saler-item.active {
  border-color: #4f87ff;
  background: rgba(79, 135, 255, 0.06);
  box-shadow: 0 12px 24px rgba(79, 135, 255, 0.14);
}

.saler-item-name {
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.saler-item-no {
  color: var(--text-muted);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.saler-input {
  margin-bottom: 6px;
}

.saler-error {
  margin: 4px 2px 0;
  color: var(--danger);
  font-size: 14px;
}

.saler-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 22px 20px;
  border-top: 1px solid #eef2f7;
  background: #fcfdff;
}
</style>
