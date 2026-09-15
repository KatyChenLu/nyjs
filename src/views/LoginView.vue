<template>
  <div class="login-page">
    <div class="pattern pattern-a"></div>
    <div class="pattern pattern-b"></div>

    <section class="login-card panel">
      <div class="logo-badge">农</div>
      <h1 class="login-title">汇泽农业收银系统</h1>

      <div class="field-wrap">
        <span class="field-icon">◌</span>
        <input
          v-model.trim="form.mobile"
          class="field login-field"
          maxlength="11"
          placeholder="输入你的账号"
          @keyup.enter="submit"
        />
      </div>

      <div class="field-wrap">
        <span class="field-icon">⌘</span>
        <input
          v-model.trim="form.password"
          class="field login-field"
          type="password"
          placeholder="输入你的密码"
          @keyup.enter="submit"
        />
      </div>

      <button class="primary-btn login-btn" type="button" :disabled="submitting" @click="submit">
        {{ submitting ? "登录中..." : "登录" }}
      </button>

      <!-- <button class="toggle-link" type="button" @click="showAdvanced = !showAdvanced">
        {{ showAdvanced ? "收起接口配置" : "接口配置" }}
      </button> -->

      <!-- <div v-if="showAdvanced" class="advanced-box">
        <input
          v-model.trim="baseUrl"
          class="field"
          placeholder="接口基础地址，例如 https://www.mxsit.com"
        />
        <p class="advanced-tip">未填写时默认使用 `https://www.mxsit.com`</p>
      </div> -->

      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
    </section>

    <footer class="login-footer">版本号 156456564564664564</footer>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, authStore, getErrorMessage } from "../services/api.js";
import { ensureCurrentXpyunPrinterBound, isXpyunConfigured } from "../services/xpyun.js";

const router = useRouter();
const route = useRoute();

const form = reactive({
  mobile: "",
  password: ""
});

const submitting = ref(false);
const errorMessage = ref("");
const showAdvanced = ref(false);
const baseUrl = ref(authStore.getBaseUrl());

async function submit() {
  if (!/^1\d{10}$/.test(form.mobile)) {
    errorMessage.value = "请输入正确的手机号账号";
    return;
  }
  if (!form.password) {
    errorMessage.value = "请输入登录密码";
    return;
  }

  submitting.value = true;
  errorMessage.value = "";

  try {
    authStore.setBaseUrl(baseUrl.value);
    const user = await api.login({
      mobile: form.mobile,
      password: form.password
    });

    if (isXpyunConfigured()) {
      ensureCurrentXpyunPrinterBound(user).catch((error) => {
        console.warn("芯烨云打印机自动绑定失败", error);
      });
    }

    router.replace(String(route.query.redirect || "/cashier"));
  } catch (error) {
    errorMessage.value = getErrorMessage(error, "登录失败");
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  overflow: hidden;
  padding: 24px;
}

.pattern {
  position: absolute;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 34px;
  transform: rotate(45deg);
}

.pattern-a {
  width: 520px;
  height: 520px;
  top: 60px;
  right: -80px;
  box-shadow:
    -110px -80px 0 -2px rgba(255, 255, 255, 0.2),
    -220px 40px 0 -2px rgba(255, 255, 255, 0.18),
    -40px 180px 0 -2px rgba(255, 255, 255, 0.12);
}

.pattern-b {
  width: 360px;
  height: 360px;
  left: -120px;
  top: 120px;
  box-shadow:
    180px 80px 0 -2px rgba(255, 255, 255, 0.18),
    310px -40px 0 -2px rgba(255, 255, 255, 0.12);
}

.login-card {
  position: relative;
  z-index: 1;
  width: min(392px, 100%);
  padding: 34px 34px 28px;
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 18px;
  box-shadow: 0 20px 50px rgba(11, 39, 72, 0.12);
}

.logo-badge {
  width: 68px;
  height: 68px;
  margin: 0 auto 14px;
  border-radius: 50%;
  background: linear-gradient(180deg, #eff6df 0%, #d7e8b1 100%);
  color: #336042;
  display: grid;
  place-items: center;
  font-size: 30px;
  font-weight: 800;
  box-shadow: inset 0 0 0 4px rgba(51, 96, 66, 0.12);
}

.login-title {
  margin: 0 0 26px;
  color: #2d3138;
  font-size: 24px;
  font-weight: 800;
}

.field-wrap {
  position: relative;
  margin-bottom: 14px;
}

.field-icon {
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: #8d97a5;
  font-size: 18px;
}

.login-field {
  padding-left: 48px;
  height: 48px;
  border-radius: 12px;
}

.login-btn {
  width: 100%;
  margin-top: 18px;
  min-height: 48px;
  border-radius: 12px;
  background: linear-gradient(180deg, #404040 0%, #303030 100%);
  box-shadow: none;
}

.toggle-link {
  margin-top: 14px;
  border: none;
  background: transparent;
  color: #5f6b7a;
  font-size: 13px;
}

.advanced-box {
  margin-top: 16px;
  text-align: left;
}

.advanced-tip {
  margin: 8px 4px 0;
  color: #667085;
  font-size: 12px;
}

.error-text {
  margin: 14px 0 0;
  color: var(--danger);
  font-size: 14px;
}

.login-footer {
  position: absolute;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  color: rgba(74, 86, 99, 0.66);
  font-size: 13px;
}
</style>
