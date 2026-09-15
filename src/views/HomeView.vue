<template>
  <div class="page-shell">
    <AppHeader active="home" />

    <main class="home-main">
      <section class="mode-grid">
        <button class="mode-card panel" type="button" @click="router.push('/cashier')">
          <div class="mode-graphic mode-cart">
            <span class="cart-top"></span>
            <span class="cart-basket"></span>
            <span class="cart-wheel cart-wheel-left"></span>
            <span class="cart-wheel cart-wheel-right"></span>
          </div>
          <div class="mode-title">线下订单</div>
        </button>

        <button class="mode-card panel" type="button" @click="router.push('/pickup')">
          <div class="mode-graphic mode-bag">
            <span class="bag-body"></span>
            <span class="bag-handle"></span>
            <span class="bag-point bag-point-left"></span>
            <span class="bag-point bag-point-right"></span>
          </div>
          <div class="mode-title">自提订单</div>
        </button>
      </section>

      <section class="info-strip panel">
        <div>
          <h2 class="section-heading">店铺信息</h2>
          <!-- <p class="section-subtitle">密码登录、商品分类、商品列表、条码查商品、会员查询、充值、结算</p> -->
        </div>
        <div class="store-meta">
          <div>店铺：{{ user?.shopname || "未登录门店" }}</div>
          <div>联系人：{{ user?.contact || "-" }}</div>
          <div>电话：{{ user?.mobile || "-" }}</div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import AppHeader from "../components/AppHeader.vue";
import { authStore } from "../services/api.js";

const router = useRouter();
const user = computed(() => authStore.getCachedUser());
</script>

<style scoped>
.home-main {
  padding: 72px 42px 36px;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(260px, 360px));
  justify-content: center;
  gap: 96px;
}

.mode-card {
  min-height: 360px;
  border: 4px solid var(--navy-800);
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 18px 40px rgba(8, 38, 75, 0.18);
  display: grid;
  place-items: center;
  align-content: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.mode-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 26px 54px rgba(8, 38, 75, 0.2);
}

.mode-graphic {
  position: relative;
  width: 170px;
  height: 150px;
}

.mode-title {
  margin-top: 34px;
  color: var(--navy-800);
  font-size: 42px;
  font-weight: 800;
}

.mode-cart .cart-top {
  position: absolute;
  left: 18px;
  top: 20px;
  width: 34px;
  height: 10px;
  background: var(--navy-800);
  border-radius: 8px;
}

.mode-cart .cart-basket {
  position: absolute;
  left: 42px;
  top: 30px;
  width: 92px;
  height: 58px;
  border: 8px solid var(--navy-800);
  border-left-width: 10px;
  transform: skewX(-10deg);
  border-radius: 6px;
}

.mode-cart .cart-basket::after {
  content: "";
  position: absolute;
  left: -14px;
  bottom: -34px;
  width: 102px;
  border-bottom: 8px solid var(--navy-800);
}

.mode-cart .cart-wheel {
  position: absolute;
  bottom: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--navy-800);
}

.mode-cart .cart-wheel-left {
  left: 72px;
}

.mode-cart .cart-wheel-right {
  left: 118px;
}

.mode-bag .bag-body {
  position: absolute;
  left: 34px;
  top: 34px;
  width: 102px;
  height: 90px;
  border: 8px solid var(--navy-800);
  border-radius: 8px;
}

.mode-bag .bag-body::before,
.mode-bag .bag-body::after {
  content: "";
  position: absolute;
  top: 26px;
  width: 12px;
  height: 12px;
  background: var(--navy-800);
  border-radius: 2px;
}

.mode-bag .bag-body::before {
  left: 18px;
}

.mode-bag .bag-body::after {
  right: 18px;
}

.mode-bag .bag-handle {
  position: absolute;
  left: 58px;
  top: 2px;
  width: 54px;
  height: 50px;
  border: 8px solid var(--navy-800);
  border-bottom: none;
  border-radius: 28px 28px 0 0;
}

.mode-bag .bag-point {
  position: absolute;
  bottom: 20px;
  width: 10px;
  height: 18px;
  background: var(--navy-800);
  border-radius: 4px;
}

.mode-bag .bag-point-left {
  left: 56px;
}

.mode-bag .bag-point-right {
  right: 56px;
}

.info-strip {
  width: min(980px, 100%);
  margin: 56px auto 0;
  padding: 24px 28px;
  display: flex;
  justify-content: space-between;
  gap: 24px;
  background: rgba(255, 255, 255, 0.9);
}

.store-meta {
  color: #475467;
  line-height: 1.9;
}

@media (max-width: 980px) {
  .home-main {
    padding: 40px 20px 28px;
  }

  .mode-grid {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .info-strip {
    flex-direction: column;
  }

  .mode-title {
    font-size: 36px;
  }
}
</style>
