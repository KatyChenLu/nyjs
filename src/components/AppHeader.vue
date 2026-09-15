<template>
  <header class="app-header-shell">
    <div class="app-header">
      <div class="brand" >
        <div class="brand-mark"@click="goHome">b</div>
        <div class="brand-copy" @click="openSalerModal">
          <div class="brand-title">{{ shopName }}</div>
          <div class="brand-meta">
            <template v-if="salerName">店员：{{ salerName }}</template>
            <template v-else>店员：未登录</template>
            <button class="meta-switch" type="button" @click="openSalerModal">交接班</button>
          </div>
        </div>
      </div>

      <div class="header-right">
        <div class="status-pill">
          <span class="status-dot"></span>
          <span>在线</span>
        </div>

        <nav class="header-nav">
          <button
            v-for="item in navItems"
            :key="item.key"
            class="nav-item"
            :class="{ active: active === item.key }"
            type="button"
            @click="navigate(item)"
          >
            <span class="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="presentation">
                <path :d="item.icon" />
              </svg>
            </span>
            <span>{{ item.label }}</span>
          </button>
        </nav>

        <button class="logout-btn" type="button" @click="logout">退出登录</button>
      </div>
    </div>
    <div class="app-header-spacer" aria-hidden="true"></div>
  </header>

  <SalerLoginModal :visible="salerModalVisible" @close="salerModalVisible = false" @confirm="onSalerChanged" />

</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { authStore } from "../services/api.js";
import SalerLoginModal from "./SalerLoginModal.vue";

const props = defineProps({
  active: {
    type: String,
    default: "home"
  }
});

const router = useRouter();

const navItems = [
  { key: "cashier", label: "收银", icon: "M6 4.5h10.4A2.1 2.1 0 0 1 18.5 6.6v1.1h-9a2.6 2.6 0 0 0-2.6 2.6v5.2A2.6 2.6 0 0 0 9.5 18h9v1A2.5 2.5 0 0 1 16 21.5H6A2.5 2.5 0 0 1 3.5 19V7A2.5 2.5 0 0 1 6 4.5Zm2.4 5.2h12.1v6.1H8.4a1.1 1.1 0 0 1-1.1-1.1v-3.9a1.1 1.1 0 0 1 1.1-1.1Zm7.3 3.05a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3Z", path: "/cashier" },
  { key: "pickup", label: "自提", icon: "M7 8.5V7a5 5 0 0 1 10 0v1.5h.5A1.5 1.5 0 0 1 19 10v8.5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V10a1.5 1.5 0 0 1 1.5-1.5H7Zm2 0h6V7a3 3 0 1 0-6 0v1.5Z", path: "/pickup" },
  { key: "material", label: "物料", icon: "M6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4Zm1.2 3.2a.9.9 0 0 0-.9.9v1.45c0 .5.4.9.9.9h1.45c.5 0 .9-.4.9-.9V8.1a.9.9 0 0 0-.9-.9H7.7Zm7.2 0a.9.9 0 0 0-.9.9v1.45c0 .5.4.9.9.9h1.45c.5 0 .9-.4.9-.9V8.1a.9.9 0 0 0-.9-.9H14.9ZM7.7 13.55a.9.9 0 0 0-.9.9v1.45c0 .5.4.9.9.9h1.45c.5 0 .9-.4.9-.9v-1.45a.9.9 0 0 0-.9-.9H7.7Zm6.55 1.62a1 1 0 0 0 0 2h2.2a1 1 0 1 0 0-2h-2.2Z", path: "/material-apply" },
  { key: "history", label: "记录", icon: "M6 5.5h12A1.5 1.5 0 0 1 19.5 7v10a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 17V7A1.5 1.5 0 0 1 6 5.5Zm2.2 3a1 1 0 0 0 0 2h7.6a1 1 0 1 0 0-2H8.2Zm0 4a1 1 0 1 0 0 2h7.6a1 1 0 1 0 0-2H8.2Z", path: "/history" },
  { key: "report", label: "报表", icon: "M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3 5v8h2V8H8Zm4-2v10h2V6h-2Zm4 4v6h2v-6h-2Z", path: "/member-report" }
];

const shopName = computed(() => authStore.getCachedUser()?.shopname || "汇泽农业收银系统");
const salerName = computed(() => authStore.getCachedSaler()?.salerName || "");

const salerModalVisible = ref(false);

function openSalerModal() {
  salerModalVisible.value = true;
}

function onSalerChanged() {
  salerModalVisible.value = false;
}

function goHome() {
  router.push("/home");
}

function navigate(item) {
  if (item.key === props.active) {
    return;
  }
  router.push(item.path);
}

function logout() {
  authStore.clearSession();
  router.replace("/login");
}
</script>

<style scoped>
.app-header-shell {
  display: block;
}

.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 70;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 26px 32px 40px;
  background:
    radial-gradient(circle at 52% 118%, rgba(79, 121, 255, 0.22) 0, rgba(79, 121, 255, 0.12) 20%, transparent 48%),
    linear-gradient(90deg, #0a2872 0%, #123d9e 54%, #0a2e83 100%);
  color: #ffffff;
  box-shadow: 0 18px 40px rgba(8, 34, 92, 0.18);
}

.app-header-spacer {
  height: var(--app-header-h);
}

.app-header::after {
  content: "";
  position: absolute;
  left: -12%;
  right: -12%;
  bottom: -58px;
  height: 128px;
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.08) 30%, rgba(255, 255, 255, 0.02) 55%, transparent 72%);
  pointer-events: none;
}

.brand {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 18px;
  cursor: pointer;
}

.brand-mark {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 3px solid rgba(120, 167, 255, 0.9);
  display: grid;
  place-items: center;
  font-size: 28px;
  font-weight: 800;
  text-transform: lowercase;
  background: rgba(7, 38, 114, 0.26);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.brand-title {
  font-size: 20px;
  font-weight: 800;
}

.brand-meta {
  margin-top: 4px;
  font-size: 14px;
  color: rgba(221, 231, 255, 0.82);
}

.meta-switch {
  margin-left: 10px;
  padding: 2px 10px;
  border: 1px solid rgba(182, 204, 255, 0.36);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  vertical-align: middle;
  transition: background 0.18s ease, border-color 0.18s ease;
}

.meta-switch:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(182, 204, 255, 0.6);
}

.header-right {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 22px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(6, 32, 91, 0.3);
  font-size: 15px;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 0 8px rgba(74, 222, 128, 0.12);
}

.header-nav {
  display: flex;
  gap: 18px;
}

.logout-btn {
  height: 54px;
  padding: 0 24px;
  border: 1px solid rgba(182, 204, 255, 0.26);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
  font-size: 16px;
  font-weight: 800;
  white-space: nowrap;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-item {
  flex: 0 0 86px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 86px;
  min-height: 74px;
  padding: 8px 10px;
  border: none;
  border-radius: 18px;
  background: transparent;
  color: rgba(231, 239, 255, 0.9);
  font-weight: 700;
  font-size: 14px;
}

.nav-item.active {
  background: linear-gradient(180deg, rgba(94, 132, 255, 0.86) 0%, rgba(76, 113, 236, 0.92) 100%);
  color: #ffdc67;
  box-shadow: 0 12px 24px rgba(55, 93, 220, 0.28);
}

.nav-icon svg {
  width: 22px;
  height: 22px;
  fill: currentColor;
}

@media (max-width: 860px) {
  .app-header {
    flex-direction: column;
    align-items: stretch;
    padding-bottom: 28px;
  }

  .app-header-spacer {
    height: 204px;
  }

  .header-right {
    justify-content: space-between;
  }
}

@media (max-width: 640px) {
  .header-right {
    flex-direction: column;
    align-items: stretch;
  }

  .header-nav {
    width: 100%;
  }

  .nav-item {
    flex: 1;
    width: auto;
  }

  .logout-btn {
    width: 100%;
  }
}

@media (max-width: 1180px), (max-height: 860px) {
  .app-header {
    padding: 18px 22px 28px;
    gap: 16px;
  }

  .brand-mark {
    width: 48px;
    height: 48px;
    font-size: 23px;
  }

  .brand-title {
    font-size: 18px;
  }

  .nav-item {
    min-height: 66px;
  }
}

@media (max-width: 760px), (max-height: 700px) {
  .app-header {
    padding: 14px 16px 20px;
    gap: 12px;
  }

  .brand-mark {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }

  .brand-title {
    font-size: 16px;
  }

  .brand-meta {
    font-size: 13px;
  }

  .nav-item {
    min-height: 56px;
    flex: 0 0 72px;
    width: 72px;
    font-size: 13px;
  }

  .status-pill {
    padding: 8px 12px;
    font-size: 13px;
  }
}
</style>
