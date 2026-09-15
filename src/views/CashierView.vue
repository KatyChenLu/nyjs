<template>
  <div class="page-shell">
    <AppHeader active="cashier" />

    <main class="cashier-main">
      <section class="search-panel panel">
        <div class="search-grid">
          <div class="scan-group">
            <div class="input-shell scan-input-shell">
              <span class="input-icon barcode-lines" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </span>
              <input
                v-model.trim="barcodeKeyword"
                class="hero-field"
                placeholder="扫描条码或输入商品名称"
                @keyup.enter="searchByBarcode"
              />
            </div>
            <button class="hero-search-btn" type="button" @click="searchByBarcode">搜索</button>
            <button class="quick-pick-card" type="button" @click="openLibrary">
              <!-- <span class="quick-pick-icon">★</span> -->
              <span>快捷选择</span>
            </button>
          </div>

          <div class="member-group">
            <div class="input-shell member-input-shell">
              <span class="input-icon user-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="presentation">
                  <path d="M12 12.5a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.2 0-7 2.14-7 4.3 0 .66.54 1.2 1.2 1.2h11.6c.66 0 1.2-.54 1.2-1.2 0-2.16-2.8-4.3-7-4.3Z" />
                </svg>
              </span>
              <input
                v-model.trim="memberKeyword"
                class="hero-field"
                placeholder="输入会员手机号"
                @keyup.enter="searchMember"
              />
            </div>
            <button class="member-search-btn" type="button" @click="searchMember">
              <span class="member-search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="presentation">
                  <path d="M12 12.5a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.2 0-7 2.14-7 4.3 0 .66.54 1.2 1.2 1.2h5.2v-1.8c0-1.38.52-2.64 1.38-3.6A11.7 11.7 0 0 0 12 14.5Zm6.4 5.3-1.98-1.98a3.8 3.8 0 1 0-1.28 1.28l1.98 1.98a.9.9 0 0 0 1.28-1.28Zm-5.2-1.4a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 0 4.8Z" />
                </svg>
              </span>
              <span>查会员</span>
            </button>
          </div>
        </div>

        <div class="search-footer">
          <div v-if="selectedMember" class="selected-member-pill">
            <span>{{ selectedMember.username }} · {{ selectedMember.mobile }}</span>
            <span>余额 ¥{{ formatMoney(selectedMember.money) }}</span>
            <span>折扣 {{ selectedMember.rate || 100 }}%</span>
            <button type="button" @click="openMemberLogDialog">资金记录</button>
            <button type="button" @click="clearMember">移除</button>
          </div>

          <div v-if="selectedMember" class="member-recharge-inline">
            <input
              v-model.trim="rechargeAmount"
              class="member-recharge-input"
              placeholder="充值金额"
              @keyup.enter="rechargeMember"
            />
            <button type="button" @click="rechargeMember">充值</button>
          </div>
        </div>

        <div v-if="memberList.length" class="member-result-strip">
          <button
            v-for="item in memberList"
            :key="item.id"
            class="member-result-chip"
            type="button"
            @click="selectMember(item)"
          >
            <span>{{ item.username }} · {{ item.mobile }}</span>
            <span>余额 ¥{{ formatMoney(item.money) }}</span>
          </button>
        </div>
      </section>

      <div v-if="notice" class="notice-banner" :class="notice.type">{{ notice.text }}</div>

      <section class="table-card panel">
        <div class="table-title">
          <div class="table-title-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="presentation">
              <path d="M7 6h13l-1.3 7.2a2 2 0 0 1-2 1.64H9.2a2 2 0 0 1-1.96-1.58L5.1 3.8H3.5a1 1 0 1 1 0-2H6a1 1 0 0 1 .98.8L7.42 5H7Zm2 13.5A1.75 1.75 0 1 1 7.25 17.75 1.75 1.75 0 0 1 9 19.5Zm8 0a1.75 1.75 0 1 1-1.75-1.75A1.75 1.75 0 0 1 17 19.5Z" />
            </svg>
          </div>
          <span>已扫描商品</span>
        </div>

        <div class="table-scroll">
          <table class="goods-table">
            <thead>
              <tr>
                <th>条码</th>
                <th>品名</th>
                <th>单价</th>
                <th>数量/重量</th>
                <th>优惠</th>
                <th>库存</th>
                <th>小计</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in cart" :key="item.id">
                <td>{{ item.barcode || "-" }}</td>
                <td>
                  <div class="goods-name-cell">{{ item.goodsName }}</div>
                  <div class="goods-spec-cell">{{ item.spec }}</div>
                </td>
                <td class="money">¥{{ formatMoney(item.salePrice) }}</td>
                <td>
                  <div class="stepper">
                    <button type="button" @click="changeQty(item, -1)">-</button>
                    <input
                      :value="item.qty"
                      @input="setQty(item, $event.target.value)"
                    />
                    <button type="button" @click="changeQty(item, 1)">+</button>
                  </div>
                </td>
                <td class="money">¥{{ formatMoney(item.discountAmount * item.qty) }}</td>
                <td>{{ item.shopStock ?? item.stock ?? 0 }}</td>
                <td class="money">¥{{ formatMoney(item.salePrice * item.qty) }}</td>
                <td>
                  <button class="remove-btn" type="button" @click="removeItem(item.id)">删除</button>
                </td>
              </tr>

              <tr v-if="!cart.length">
                <td colspan="8" class="empty-row">
                  <div class="empty-state">
                    <div class="empty-state-graphic" aria-hidden="true">
                      <span class="empty-orb"></span>
                      <span class="empty-box-bottom"></span>
                      <span class="empty-box-left"></span>
                      <span class="empty-box-right"></span>
                      <span class="empty-lid-left"></span>
                      <span class="empty-lid-right"></span>
                      <span class="empty-plane"></span>
                      <span class="empty-arrow-left"></span>
                      <span class="empty-arrow-right"></span>
                    </div>
                    <div class="empty-state-title">还没有商品</div>
                    <div class="empty-state-text">先扫描条码或从商品库选择</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <footer class="checkout-bar panel">
      <div class="summary-block">
        <div class="summary-item">
          <strong>{{ cartCount }}</strong>
          <span>件数</span>
        </div>
        <div class="summary-item">
          <strong class="money">¥{{ formatMoney(grossAmount) }}</strong>
          <span>总额</span>
        </div>
        <div class="summary-item discount">
          <strong class="money">-¥{{ formatMoney(discountAmount) }}</strong>
          <span>优惠</span>
        </div>
        <button
          class="summary-item round-btn"
          :class="{ disabled: isMemberCheckout }"
          type="button"
          :disabled="isMemberCheckout"
          @click="openPricingDialog"
        >
          <strong>抹零</strong>
          <span>{{ isMemberCheckout ? "会员不可用" : "折扣/改价" }}</span>
        </button>
      </div>

      <div class="pay-method-bar">
        <span class="pay-method-label">支付方式：</span>
        <div class="pay-method-options">
          <button
            v-for="opt in payOptions"
            :key="opt.key"
            class="pay-method-btn"
            :class="{ active: selectedPay.key === opt.key }"
            type="button"
            @click="selectPay(opt)"
          >
            <span>{{ opt.label }}</span>
          </button>
        </div>
      </div>

      <div class="checkout-actions">
        <button class="clear-cart-btn" type="button" @click="clearCart">
          <span class="clear-cart-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="presentation">
              <path d="M9 3.5h6l.8 1.5H19a1 1 0 1 1 0 2h-1l-.9 11.1A2 2 0 0 1 15.1 20H8.9a2 2 0 0 1-1.99-1.89L6 7H5a1 1 0 1 1 0-2h3.2L9 3.5Zm.4 4.5.5 8.2a1 1 0 1 0 2-.12L11.4 8H9.4Zm5.2 0h-2l-.5 8.08a1 1 0 0 0 2 .12L14.6 8Z" />
            </svg>
          </span>
          <span>清空购物车</span>
        </button>

        <button class="settle-btn" type="button" :disabled="settling || !cart.length" @click="settle">
          <span class="settle-btn-icon" aria-hidden="true">↪</span>
          <span>{{ settling ? "结算中..." : `收银: ¥${formatMoney(payableAmount)}` }}</span>
          <span class="settle-btn-arrow" aria-hidden="true">›</span>
        </button>
      </div>
    </footer>

    <ProductLibraryModal
      :visible="libraryVisible"
      :loading="libraryLoading"
      :categories="categories"
      :active-category-id="activeCategoryId"
      :goods="libraryGoods"
      :selected-ids="selectedGoodsIds"
      :show-apply-action="true"
      @close="closeLibrary"
      @confirm="confirmLibrarySelection"
      @change-category="changeCategory"
      @toggle="toggleLibraryGoods"
      @apply-action="goMaterialApply"
      @search="searchGoodsByName"
    />

    <div v-if="pricingDialogVisible" class="pricing-mask" @click.self="closePricingDialog">
      <div class="pricing-dialog panel">
        <div class="pricing-header">
          <span>{{ pricingTab === 'discount' ? '折扣' : '改价' }}</span>
          <button class="pricing-close" type="button" @click="closePricingDialog">×</button>
        </div>

        <div class="pricing-tabs">
          <button
            class="pricing-tab"
            :class="{ active: pricingTab === 'discount' }"
            type="button"
            @click="switchPricingTab('discount')"
          >
            折扣
          </button>
          <button
            class="pricing-tab"
            :class="{ active: pricingTab === 'price' }"
            type="button"
            @click="switchPricingTab('price')"
          >
            改价
          </button>
        </div>

        <div class="pricing-input-row">
          <div class="pricing-display">
            <input
              v-model="pricingInput"
              class="pricing-input"
              :placeholder="pricingTab === 'discount' ? '输入折扣比例' : '输入改后总价'"
              inputmode="decimal"
              @input="filterPricingInput"
              @keyup.enter="applyPricing"
            />
            <span class="pricing-unit">{{ pricingTab === 'discount' ? '%' : '元' }}</span>
          </div>
        </div>

        <div class="pricing-preview">
          <div class="pricing-summary-card">
            <span class="pricing-summary-label">原价</span>
            <strong class="money">¥{{ formatMoney(basePayableAmount) }}</strong>
          </div>
          <div class="pricing-tip">{{ pricingLimitText }}</div>
          <div v-if="pricingError" class="pricing-error">{{ pricingError }}</div>
          <div class="pricing-summary-card confirm">
            <span class="pricing-summary-label">确认后</span>
            <strong class="money">¥{{ formatMoney(pricingPreview.payable) }}</strong>
          </div>
        </div>

        <div class="pricing-keypad">
          <button v-for="key in pricingKeys" :key="key" type="button" @click="handlePricingKey(key)">{{ key }}</button>
        </div>
        <div class="pricing-keypad-bottom">
          <button type="button" @click="handlePricingKey('0')">0</button>
          <button type="button" @click="handlePricingKey('.')">.</button>
          <button class="backspace-key" type="button" @click="handlePricingKey('backspace')">删除</button>
          <button class="clear-key" type="button" @click="clearPricingInput">清空</button>
          <button class="confirm-key" type="button" @click="applyPricing">确认</button>
        </div>
      </div>
    </div>

    <div v-if="memberLogVisible" class="pricing-mask" @click.self="closeMemberLogDialog">
      <div class="member-log-dialog panel">
        <div class="pricing-header">
          <span>资金记录</span>
          <button class="pricing-close" type="button" @click="closeMemberLogDialog">×</button>
        </div>

        <div class="member-log-dialog-body">
          <div class="member-log-head">
            <div class="member-log-title">{{ selectedMember?.username || "-" }}</div>
            <div class="member-log-sub">手机号 {{ selectedMember?.mobile || "-" }}</div>
          </div>

          <div v-if="memberLogLoading" class="member-log-empty">资金记录加载中...</div>

          <div v-else-if="memberLogs.length" class="member-log-list">
            <div v-for="item in memberLogs" :key="item.id" class="member-log-item">
              <div class="member-log-top">
                <span class="member-log-type">{{ item.typeName || '资金变动' }}</span>
                <span class="member-log-money" :class="{ income: item.money > 0 }">
                  {{ item.money > 0 ? '+' : '' }}¥{{ formatMoney(item.money) }}
                </span>
              </div>
              <div class="member-log-meta">
                <span>变动前 ¥{{ formatMoney(item.before) }}</span>
                <span>变动后 ¥{{ formatMoney(item.after) }}</span>
                <span>{{ item.createdAt }}</span>
              </div>
              <div v-if="item.memo" class="member-log-memo">{{ item.memo }}</div>
            </div>
          </div>

          <div v-else class="member-log-empty">暂无资金记录</div>
        </div>
      </div>
    </div>

    <div v-if="payPasswordVisible" class="pricing-mask" @click.self="closePayPasswordDialog">
      <div class="pay-password-dialog panel">
        <div class="pricing-header">
          <span>短信验证</span>
          <button class="pricing-close" type="button" @click="closePayPasswordDialog">×</button>
        </div>
        <div class="pay-password-body">
          <div class="pay-password-info">
            <span>余额支付需短信验证</span>
            <span class="pay-password-amount money">¥{{ formatMoney(payableAmount) }}</span>
          </div>
          <div class="pay-password-input-row">
            <div class="sms-code-wrap">
              <input
                v-model="payPasswordInput"
                class="pay-password-field sms-code-field"
                type="text"
                inputmode="numeric"
                maxlength="6"
                placeholder="请输入短信验证码"
                @input="filterNumericInput"
                @keyup.enter="confirmPayPassword"
              />
              <button
                class="sms-send-btn"
                type="button"
                :disabled="smsCountdown > 0 || smsSending"
                @click="sendPaySms"
              >
                {{ smsSending ? '发送中...' : smsCountdown > 0 ? `${smsCountdown}s` : '获取验证码' }}
              </button>
            </div>
          </div>
          <button
            class="pay-password-confirm-btn"
            type="button"
            :disabled="!payPasswordInput || payPasswordVerifying"
            @click="confirmPayPassword"
          >
            {{ payPasswordVerifying ? '验证中...' : '确认支付' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import AppHeader from "../components/AppHeader.vue";
import ProductLibraryModal from "../components/ProductLibraryModal.vue";
import { api, authStore, formatDateTime, formatMoney, getErrorMessage } from "../services/api.js";
import { registerScannerListener } from "../services/scanner.js";
import { printReceipt } from "../utils/print.js";

const HELD_ORDERS_KEY = "ny_cashier_held_orders";
const TRADE_RECORDS_KEY = "ny_cashier_trade_records";
const MATERIAL_APPLY_DRAFT_KEY = "ny_cashier_material_apply_draft";

const router = useRouter();

const barcodeKeyword = ref("");
const memberKeyword = ref("");
const rechargeAmount = ref("");
const memberList = ref([]);
const selectedMember = ref(null);
const memberLogs = ref([]);
const memberLogLoading = ref(false);
const memberLogVisible = ref(false);
const cart = ref([]);

const categories = ref([{ id: 0, name: "全部" }]);
const activeCategoryId = ref(0);
const libraryGoods = ref([]);
const selectedGoodsIds = ref([]);
const libraryVisible = ref(false);
const libraryLoading = ref(false);
const heldOrderCount = ref(0);

const notice = ref(null);
const settling = ref(false);
const payPasswordVisible = ref(false);
const payPasswordInput = ref("");
const payPasswordVerifying = ref(false);
const smsSending = ref(false);
const smsCountdown = ref(0);
let smsTimer = 0;
const roundRate = ref(0);
const pricingDialogVisible = ref(false);
const pricingTab = ref("discount");
const pricingInput = ref("");
const pricingError = ref("");
const appliedPricing = ref({
  mode: "",
  value: ""
});

const payOptions = [
  { key: "wechat", label: "微信/支付宝", payType: 1 },
  { key: "balance", label: "余额", payType: 2 },
  { key: "cash", label: "现金", payType: 3 },
];

const selectedPay = ref(payOptions[1]);

function selectPay(opt) {
  selectedPay.value = opt;
}

const cartCount = computed(() => cart.value.reduce((sum, item) => sum + item.qty, 0));
const grossAmount = computed(() => cart.value.reduce((sum, item) => sum + item.originalPrice * item.qty, 0));
const goodsDiscountAmount = computed(() => cart.value.reduce((sum, item) => sum + item.discountAmount * item.qty, 0));
const basePayableAmount = computed(() => cart.value.reduce((sum, item) => sum + item.salePrice * item.qty, 0));
const isMemberCheckout = computed(() => Boolean(selectedMember.value?.id));
const maxRoundDiscountAmount = computed(() => {
  if (isMemberCheckout.value) {
    return 0;
  }
  return Number((basePayableAmount.value * Math.max(roundRate.value, 0) / 100).toFixed(2));
});
const minRoundPrice = computed(() => Math.max(Number((basePayableAmount.value - maxRoundDiscountAmount.value).toFixed(2)), 0));
const minRoundDiscountRate = computed(() => Math.max(Number((100 - Math.max(roundRate.value, 0)).toFixed(2)), 0));
const manualDiscountAmount = computed(() => calculateManualDiscount(appliedPricing.value.mode, appliedPricing.value.value));
const discountAmount = computed(() => goodsDiscountAmount.value + manualDiscountAmount.value);
const payableAmount = computed(() => Math.max(basePayableAmount.value - manualDiscountAmount.value, 0));
const pricingPreview = computed(() => {
  const discount = calculateManualDiscount(pricingTab.value, pricingInput.value);
  return {
    discount,
    payable: Math.max(basePayableAmount.value - discount, 0)
  };
});
const pricingLimitText = computed(() => {
  if (pricingTab.value === "discount") {
    return `请输入 ${formatMoney(minRoundDiscountRate.value)}% - 100% 之间的折扣`;
  }
  return `请输入 ¥${formatMoney(minRoundPrice.value)} - ¥${formatMoney(basePayableAmount.value)} 之间的价格`;
});

const pricingKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

let removeScannerListener = () => {};
let noticeTimer = 0;

function showNotice(text, type = "info") {
  notice.value = { text, type };
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => {
    notice.value = null;
  }, 2400);
}

function readHeldOrders() {
  try {
    const raw = window.localStorage.getItem(HELD_ORDERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function readTradeRecords() {
  try {
    const raw = window.localStorage.getItem(TRADE_RECORDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeTradeRecord(record) {
  const all = readTradeRecords();
  all.unshift(record);
  window.localStorage.setItem(TRADE_RECORDS_KEY, JSON.stringify(all.slice(0, 500)));
}

function syncHeldOrderCount() {
  heldOrderCount.value = readHeldOrders().length;
}

function calculateManualDiscount(mode, rawValue) {
  if (isMemberCheckout.value) {
    return 0;
  }
  const baseAmount = basePayableAmount.value;
  if (!baseAmount) {
    return 0;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  if (mode === "discount") {
    const rate = Math.max(minRoundDiscountRate.value, Math.min(parsed <= 10 ? parsed * 10 : parsed, 100));
    return Math.max(baseAmount * (1 - rate / 100), 0);
  }

  if (mode === "price") {
    const targetAmount = Math.max(minRoundPrice.value, Math.min(parsed, baseAmount));
    return Math.max(baseAmount - targetAmount, 0);
  }

  return 0;
}

function resetPricing() {
  appliedPricing.value = {
    mode: "",
    value: ""
  };
}

function getMemberRate(member = selectedMember.value) {
  const rate = Number(member?.rate);
  return Number.isFinite(rate) && rate > 0 ? rate : 100;
}

function calculateGoodsSalePrice(goods, member = selectedMember.value) {
  const originalPrice = Number(goods?.originalPrice ?? goods?.salePrice ?? 0);
  if (Number(goods?.label || 0) !== 0) {
    const activityPrice = Number(goods?.activityPrice ?? goods?.salePrice ?? originalPrice);
    return Number.isFinite(activityPrice) ? activityPrice : originalPrice;
  }

  const memberRate = getMemberRate(member);
  return Number((originalPrice * memberRate / 100).toFixed(2));
}

function toDisplayGoods(goods, member = selectedMember.value) {
  const salePrice = calculateGoodsSalePrice(goods, member);
  return {
    ...goods,
    salePrice,
    discountAmount: Math.max(Number(goods.originalPrice || 0) - salePrice, 0)
  };
}

function refreshCartPrices(member = selectedMember.value) {
  cart.value = cart.value.map((item) => {
    const salePrice = calculateGoodsSalePrice(item, member);
    return {
      ...item,
      salePrice,
      discountAmount: Math.max(Number(item.originalPrice || 0) - salePrice, 0)
    };
  });
}

function openPricingDialog() {
  if (!cart.value.length) {
    showNotice("请先添加商品", "error");
    return;
  }
  if (isMemberCheckout.value) {
    showNotice("会员不可抹零", "error");
    return;
  }
  pricingError.value = "";
  pricingTab.value = "discount";
  pricingInput.value = "";
  pricingDialogVisible.value = true;
}

function closePricingDialog() {
  pricingError.value = "";
  pricingDialogVisible.value = false;
}

function switchPricingTab(tab) {
  if (pricingTab.value === tab) {
    return;
  }
  pricingTab.value = tab;
  pricingInput.value = "";
  pricingError.value = "";
}

function handlePricingKey(key) {
  pricingError.value = "";
  if (key === "backspace") {
    pricingInput.value = pricingInput.value.slice(0, -1);
    return;
  }

  if (key === "." && pricingInput.value.includes(".")) {
    return;
  }

  if (key === "." && !pricingInput.value) {
    pricingInput.value = "0.";
    return;
  }

  pricingInput.value += key;
}

function filterPricingInput(event) {
  const rawValue = String(event?.target?.value ?? pricingInput.value ?? "");
  let nextValue = "";
  let hasDot = false;

  for (const char of rawValue) {
    if (char >= "0" && char <= "9") {
      nextValue += char;
      continue;
    }
    if (char === "." && !hasDot) {
      nextValue += nextValue ? "." : "0.";
      hasDot = true;
    }
  }

  pricingInput.value = nextValue;
}

function clearPricingInput() {
  pricingInput.value = "";
  pricingError.value = "";
}

function applyPricing() {
  if (!pricingInput.value) {
    resetPricing();
    closePricingDialog();
    showNotice("已清除额外优惠");
    return;
  }

  const parsed = Number(pricingInput.value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    pricingError.value = "请输入正确的抹零数值";
    return;
  }

  if (pricingTab.value === "discount") {
    const rate = parsed <= 10 ? parsed * 10 : parsed;
    if (rate < minRoundDiscountRate.value || rate > 100) {
      pricingError.value = `折扣范围需在${formatMoney(minRoundDiscountRate.value)}%-100%`;
      return;
    }
  }

  if (pricingTab.value === "price" && parsed < minRoundPrice.value) {
    pricingError.value = `改价后最低¥${formatMoney(minRoundPrice.value)}`;
    return;
  }

  if (pricingTab.value === "price" && parsed > basePayableAmount.value) {
    pricingError.value = `改价后最高¥${formatMoney(basePayableAmount.value)}`;
    return;
  }

  pricingError.value = "";
  appliedPricing.value = {
    mode: pricingTab.value,
    value: pricingInput.value
  };
  closePricingDialog();
  showNotice(pricingTab.value === "discount" ? "折扣已应用" : "改价已应用");
}

function buildCartItem(goods) {
  return {
    ...toDisplayGoods(goods),
    qty: 1
  };
}

function addGoodsToCart(goods) {
  const existing = cart.value.find((item) => {
    if (item.barcode && goods.barcode) {
      return item.barcode === goods.barcode;
    }
    return item.id === goods.id;
  });
  if (existing) {
    existing.qty += 1;
    showNotice(`已增加 ${goods.goodsName}`);
    return;
  }
  cart.value = [...cart.value, buildCartItem(goods)];
  showNotice(`已添加 ${goods.goodsName}`);
}

async function loadCatalog(typeId = 0) {
  libraryLoading.value = true;
  try {
    const result = await api.fetchCatalog({ typeId, keyword: "", page: 1 });
    categories.value = result.categories.length ? result.categories : [{ id: 0, name: "全部" }];
    libraryGoods.value = result.goodsPage.list.map((item) => toDisplayGoods(item));
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
    libraryGoods.value = result.list.map((item) => toDisplayGoods(item));
  } catch (error) {
    showNotice(getErrorMessage(error, "分类商品加载失败"), "error");
  } finally {
    libraryLoading.value = false;
  }
}

function openLibrary() {
  libraryVisible.value = true;
  if (!libraryGoods.value.length) {
    loadCatalog(activeCategoryId.value);
  }
}

function closeLibrary() {
  libraryVisible.value = false;
  selectedGoodsIds.value = [];
  loadCategoryGoods(activeCategoryId.value);
}

function toggleLibraryGoods(item) {
  if (selectedGoodsIds.value.includes(item.id)) {
    selectedGoodsIds.value = selectedGoodsIds.value.filter((id) => id !== item.id);
    return;
  }
  selectedGoodsIds.value = [...selectedGoodsIds.value, item.id];
}

function confirmLibrarySelection() {
  libraryGoods.value
    .filter((item) => selectedGoodsIds.value.includes(item.id))
    .forEach((item) => addGoodsToCart(item));
  closeLibrary();
}

function goMaterialApply() {
  const selectedGoods = libraryGoods.value.filter((item) => selectedGoodsIds.value.includes(item.id));
  if (selectedGoods.length) {
    window.sessionStorage.setItem(MATERIAL_APPLY_DRAFT_KEY, JSON.stringify(selectedGoods));
  } else {
    window.sessionStorage.removeItem(MATERIAL_APPLY_DRAFT_KEY);
  }
  closeLibrary();
  router.push("/material-apply");
}

async function changeCategory(category) {
  activeCategoryId.value = category.id;
  selectedGoodsIds.value = [];
  await loadCategoryGoods(category.id);
}

async function handleBarcode(barcode) {
  const code = String(barcode || "").trim();
  if (!code) {
    return;
  }
  try {
    const goods = await api.fetchGoodsByBarcode(code);
    addGoodsToCart(toDisplayGoods(goods));
    barcodeKeyword.value = "";
  } catch (error) {
    showNotice(getErrorMessage(error, "条码未匹配到商品"), "error");
  }
}

async function searchByBarcode() {
  const keyword = String(barcodeKeyword.value || "").trim();
  if (!keyword) {
    showNotice("请输入条码或商品名称", "error");
    return;
  }

  // Pure/mostly numeric input is treated as barcode; otherwise do fuzzy goods search.
  const maybeBarcode = /^[0-9]{6,}$/.test(keyword);
  if (maybeBarcode) {
    await handleBarcode(keyword);
    return;
  }

  await searchGoodsByName(keyword);
}

async function searchGoodsByName(keyword) {
  if (!keyword) {
    loadCategoryGoods(activeCategoryId.value);
    return;
  }
  libraryLoading.value = true;
  try {
    const result = await api.searchGoods(keyword);
    libraryGoods.value = result.list.map((item) => toDisplayGoods(item));
    libraryVisible.value = true;
    selectedGoodsIds.value = [];
    if (!libraryGoods.value.length) {
      showNotice("未搜索到商品", "error");
    }
  } catch (error) {
    showNotice(getErrorMessage(error, "商品搜索失败"), "error");
  } finally {
    libraryLoading.value = false;
  }
}

function changeQty(item, delta) {
  const nextQty = item.qty + delta;
  if (nextQty <= 0) {
    removeItem(item.id);
    return;
  }
  item.qty = nextQty;
}

function setQty(item, value) {
  const nextQty = Math.max(1, Number(value || 1));
  item.qty = Number.isFinite(nextQty) ? nextQty : 1;
}

function removeItem(id) {
  cart.value = cart.value.filter((item) => item.id !== id);
}

function clearCheckoutState() {
  cart.value = [];
  resetPricing();
}

function clearCart() {
  clearCheckoutState();
  showNotice("购物车已清空");
}

function holdCurrentOrder() {
  if (!cart.value.length) {
    showNotice("没有可挂单的商品", "error");
    return;
  }

  const heldOrders = readHeldOrders();
  heldOrders.unshift({
    id: `hold_${Date.now()}`,
    createdAt: formatDateTime(new Date()),
    member: selectedMember.value ? { ...selectedMember.value } : null,
    cart: cart.value.map((item) => ({ ...item })),
    pay: selectedPay.value,
    pricing: { ...appliedPricing.value }
  });
  window.localStorage.setItem(HELD_ORDERS_KEY, JSON.stringify(heldOrders));
  syncHeldOrderCount();
  clearCheckoutState();
  selectedMember.value = null;
  rechargeAmount.value = "";
  showNotice("已挂单");
}

async function searchMember() {
  if (!memberKeyword.value) {
    showNotice("请输入会员手机号", "error");
    return;
  }
  try {
    memberList.value = await api.searchMembers(memberKeyword.value);
    if (!memberList.value.length) {
      showNotice("未找到匹配会员", "error");
      return;
    }
    if (memberList.value.length === 1) {
      selectMember(memberList.value[0]);
    }
  } catch (error) {
    showNotice(getErrorMessage(error, "会员查询失败"), "error");
  }
}

async function loadMemberLogs(member = selectedMember.value) {
  if (!member?.mobile) {
    memberLogs.value = [];
    return;
  }
  memberLogLoading.value = true;
  try {
    const result = await api.fetchMoneyLogs({
      type: 0,
      keyword: member.mobile
    });
    memberLogs.value = Array.isArray(result?.list) ? result.list : [];
  } catch (error) {
    memberLogs.value = [];
    showNotice(getErrorMessage(error, "资金记录加载失败"), "error");
  } finally {
    memberLogLoading.value = false;
  }
}

async function openMemberLogDialog() {
  if (!selectedMember.value) {
    return;
  }
  memberLogVisible.value = true;
  if (!memberLogs.value.length) {
    await loadMemberLogs(selectedMember.value);
  }
}

function closeMemberLogDialog() {
  memberLogVisible.value = false;
}

function selectMember(member) {
  selectedMember.value = member;
  resetPricing();
  memberList.value = [];
  libraryGoods.value = libraryGoods.value.map((item) => toDisplayGoods(item, member));
  refreshCartPrices(member);
  loadMemberLogs(member);
  showNotice(`已选择会员 ${member.username}`);
}

function clearMember() {
  selectedMember.value = null;
  resetPricing();
  memberLogs.value = [];
  memberLogVisible.value = false;
  rechargeAmount.value = "";
  libraryGoods.value = libraryGoods.value.map((item) => toDisplayGoods(item, null));
  refreshCartPrices(null);
}

async function loadRoundRate() {
  try {
    roundRate.value = await api.fetchRoundRate();
  } catch (error) {
    roundRate.value = 0;
    showNotice(getErrorMessage(error, "抹零比例加载失败"), "error");
  }
}

async function rechargeMember() {
  if (!selectedMember.value) {
    showNotice("请先选择会员", "error");
    return;
  }
  const money = Number(rechargeAmount.value);
  if (!Number.isFinite(money) || money <= 0) {
    showNotice("请输入正确的充值金额", "error");
    return;
  }
  try {
    await api.rechargeMember({
      userId: selectedMember.value.id,
      money
    });
    selectedMember.value.money += money;
    rechargeAmount.value = "";
    await loadMemberLogs(selectedMember.value);
    showNotice("充值成功");
  } catch (error) {
    showNotice(getErrorMessage(error, "充值失败"), "error");
  }
}

function buildReceipt(orderSn) {
  const user = authStore.getCachedUser();
  return {
    title: "汇泽农业收银小票",
    shopName: user?.shopname || "当前门店",
    time: formatDateTime(new Date()),
    orderSn,
    cashierName: authStore.getCachedSaler()?.salerName || "",
    lines: cart.value.map((item) => ({
      name: item.goodsName,
      qty: `${item.qty}`,
      price: item.salePrice,
      amount: item.salePrice * item.qty
    })),
    totals: [
      { label: "件数", value: `${cartCount.value}` },
      { label: "总额", value: `¥${formatMoney(grossAmount.value)}` },
      { label: "优惠", value: `-¥${formatMoney(discountAmount.value)}` },
      { label: "应收", value: `¥${formatMoney(payableAmount.value)}` },
      { label: "支付方式", value: selectedPay.value.label }
    ]
  };
}

async function settle() {
  if (!cart.value.length) {
    showNotice("请先添加商品", "error");
    return;
  }
  // 余额支付必须选择会员
  if (selectedPay.value.key === "balance" && !selectedMember.value) {
    showNotice("余额支付请先选择会员", "error");
    return;
  }
  // 余额支付需要发送短信验证码
  if (selectedPay.value.key === "balance") {
    payPasswordInput.value = "";
    payPasswordVisible.value = true;
    sendPaySms();
    return;
  }
  // 微信/现金直接结算
  await executeSettle();
}

function filterNumericInput(e) {
  e.target.value = e.target.value.replace(/\D/g, "");
  payPasswordInput.value = e.target.value;
}

async function sendPaySms() {
  if (smsSending.value || smsCountdown.value > 0) return;
  if (!selectedMember.value?.mobile) {
    showNotice("未获取到会员手机号", "error");
    return;
  }
  smsSending.value = true;
  try {
    await api.sendSms({ mobile: selectedMember.value.mobile, event: "pay" });
    showNotice("验证码已发送");
    smsCountdown.value = 60;
    smsTimer = window.setInterval(() => {
      smsCountdown.value -= 1;
      if (smsCountdown.value <= 0) {
        window.clearInterval(smsTimer);
        smsTimer = 0;
      }
    }, 1000);
  } catch (error) {
    showNotice(getErrorMessage(error, "验证码发送失败"), "error");
  } finally {
    smsSending.value = false;
  }
}

function closePayPasswordDialog() {
  payPasswordVisible.value = false;
  payPasswordInput.value = "";
  if (smsTimer) {
    window.clearInterval(smsTimer);
    smsTimer = 0;
  }
  smsCountdown.value = 0;
}

async function confirmPayPassword() {
  if (!payPasswordInput.value || payPasswordVerifying.value) return;
  payPasswordVerifying.value = true;
  try {
    payPasswordVisible.value = false;
    const code = payPasswordInput.value;
    payPasswordInput.value = "";
    await executeSettle(code);
  } catch (error) {
    showNotice(getErrorMessage(error, "支付失败"), "error");
  } finally {
    payPasswordVerifying.value = false;
  }
}

async function executeSettle(smsCode = "") {
  settling.value = true;
  try {
    const payload = {
      userId: selectedMember.value?.id || "",
      payType: selectedPay.value.payType,
      roundPrice: Number(formatMoney(manualDiscountAmount.value)),
      goods: cart.value.map((item) => ({
        goodsId: item.id,
        nums: item.qty
      }))
    };
    if (smsCode) {
      payload.code = smsCode;
    }
    await api.settlement(payload);

    // const orderSn = `POS${Date.now()}`;
    // writeTradeRecord({
    //   id: `trade_${Date.now()}`,
    //   orderSn,
    //   payLabel: selectedPay.value.label,
    //   time: formatDateTime(new Date()),
    //   payableAmount: payableAmount.value,
    //   itemCount: cartCount.value,
    //   memberMobile: selectedMember.value?.mobile || "",
    //   discountAmount: discountAmount.value,
    //   lines: cart.value.map((item) => ({
    //     key: `${orderSn}_${item.id}`,
    //     name: item.goodsName,
    //     qty: item.qty,
    //     price: item.salePrice,
    //     amount: item.salePrice * item.qty
    //   }))
    // });
    // printReceipt(buildReceipt(orderSn));
    clearCheckoutState();
    selectedMember.value = null;
    rechargeAmount.value = "";
    showNotice("结算成功");
  } catch (error) {
    showNotice(getErrorMessage(error, "结算失败"), "error");
  } finally {
    settling.value = false;
  }
}

onMounted(() => {
  loadRoundRate();
  loadCatalog(0);
  syncHeldOrderCount();
  removeScannerListener = registerScannerListener("cashier-page", (code) => {
    handleBarcode(code);
  });
});

onBeforeUnmount(() => {
  removeScannerListener();
  window.clearTimeout(noticeTimer);
  if (smsTimer) {
    window.clearInterval(smsTimer);
    smsTimer = 0;
  }
});
</script>

<style scoped>
.page-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.cashier-main {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 20px var(--gutter, 30px) 22px;
  scroll-padding-top: 20px;
}

.notice-banner {
  position: fixed;
  top: 122px;
  right: 30px;
  z-index: 40;
  min-width: 240px;
  padding: 13px 18px;
  border-radius: 16px;
  font-weight: 700;
  box-shadow: var(--shadow-sm);
}

.notice-banner.info {
  background: rgba(18, 63, 113, 0.08);
  color: var(--navy-800);
}

.notice-banner.error {
  background: rgba(229, 57, 53, 0.1);
  color: var(--danger);
}

.search-panel {
  padding: 40px 28px 28px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 28px 70px rgba(40, 83, 170, 0.08);
}

.search-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(380px, 0.85fr);
  gap: 36px;
  align-items: start;
}

.scan-group,
.member-group {
  display: flex;
  gap: 16px;
  align-items: center;
}

.input-shell {
  height: 64px;
  border: 1px solid #dce4f1;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(241, 244, 250, 0.8);
  display: flex;
  align-items: center;
}

.scan-input-shell {
  flex: 1;
  min-width: 0;
  padding: 0 20px 0 22px;
}

.member-input-shell {
  flex: 1;
  min-width: 0;
  padding: 0 18px 0 20px;
}

.input-icon {
  flex: none;
  color: #7787a3;
}

.barcode-lines {
  display: flex;
  gap: 3px;
  align-items: flex-end;
  width: 26px;
  height: 28px;
}

.barcode-lines span {
  width: 2px;
  border-radius: 999px;
  background: #5d7092;
}

.barcode-lines span:nth-child(1) { height: 18px; }
.barcode-lines span:nth-child(2) { height: 23px; }
.barcode-lines span:nth-child(3) { height: 14px; }
.barcode-lines span:nth-child(4) { height: 25px; }
.barcode-lines span:nth-child(5) { height: 19px; }

.user-icon svg,
.member-search-icon svg,
.table-title-icon svg,
.clear-cart-icon svg {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

.hero-field {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: #2a3650;
  font-size: 18px;
  font-weight: 500;
}

.hero-field::placeholder {
  color: #a0abbd;
}

.hero-search-btn,
.member-search-btn,
.quick-pick-card,
.clear-cart-btn,
.settle-btn {
  border: 1px solid #dce4f1;
}

.hero-search-btn {
  width: 92px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #5792ff 0%, #4b70ff 100%);
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  box-shadow: 0 16px 28px rgba(74, 114, 255, 0.22);
}

.quick-pick-card {
    width: 92px;
  height: 64px;
  border-radius: 16px;
  background: #ffffff;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #2b3b58;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 12px 28px rgba(20, 40, 90, 0.05);
}

.quick-pick-icon {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, #ffffff 0%, #eef4ff 100%);
  color: #4c7dff;
  font-size: 18px;
  box-shadow: inset 0 0 0 2px rgba(88, 136, 255, 0.18), 0 6px 16px rgba(80, 128, 255, 0.16);
}

.member-group {
  justify-content: flex-end;
}

.member-search-btn {
  flex: none;
  height: 64px;
  padding: 0 22px;
  border-radius: 16px;
  background: #ffffff;
  color: #2c3954;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
}

.search-footer {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.scan-tip-inline {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6d7893;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.7;
}

.scan-tip-bolt {
  color: #6c7a97;
  font-size: 16px;
}

.selected-member-pill {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(78, 123, 255, 0.08);
  color: #44629b;
  font-size: 14px;
  font-weight: 700;
}

.member-recharge-inline {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.member-recharge-input {
  width: 126px;
  height: 42px;
  border: 1px solid #dbe5f1;
  border-radius: 999px;
  background: #ffffff;
  padding: 0 14px;
  outline: none;
  color: #2a3650;
  font-size: 14px;
}

.member-recharge-input::placeholder {
  color: #a0abbd;
}

.member-recharge-inline button {
  height: 42px;
  border: 1px solid #3d66ef;
  border-radius: 999px;
  background: linear-gradient(135deg, #4f87ff 0%, #315cf0 100%);
  color: #ffffff;
  padding: 0 18px;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 10px 22px rgba(49, 92, 240, 0.18);
}

.selected-member-pill button {
  border: none;
  background: transparent;
  color: #2f63ff;
  font-weight: 700;
  padding: 0;
}

.selected-member-pill button + button {
  position: relative;
  padding-left: 12px;
}

.selected-member-pill button + button::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  width: 1px;
  height: 14px;
  background: rgba(68, 98, 155, 0.24);
  transform: translateY(-50%);
}

.member-result-strip {
  margin-top: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.member-result-chip {
  border: 1px solid #dbe5f1;
  border-radius: 999px;
  background: #f9fbff;
  padding: 10px 14px;
  color: #44506a;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
}

.table-card {
  margin-top: 30px;
  padding: 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 24px 68px rgba(42, 80, 150, 0.08);
}

.table-title {
  min-height: 84px;
  padding: 0 28px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-strong);
  font-size: 20px;
  font-weight: 800;
  border-bottom: 1px solid #edf2f8;
}

.table-title-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, #f5f8ff 0%, #e9f0ff 100%);
  color: #4f7cff;
}

.table-scroll {
  overflow: auto;
}

.goods-table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
}

.goods-table th,
.goods-table td {
  padding: 22px 18px;
  border-top: 1px solid #edf2f8;
  vertical-align: middle;
}

.goods-table thead th {
  background: #ffffff;
  color: #3e4b65;
  font-size: 17px;
  font-weight: 700;
  text-align: center;
}

.goods-table tbody tr:hover td {
  background: #fbfdff;
}

.goods-name-cell {
  max-width: 280px;
  color: var(--text-strong);
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.goods-spec-cell {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
}

.goods-table tbody td {
  text-align: center;
  color: #47526b;
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
  width: 52px;
  border-left: 1px solid #edf2f8;
  border-right: 1px solid #edf2f8;
  outline: none;
}

.remove-btn {
  border: none;
  background: transparent;
  color: #4d73d8;
  font-size: 14px;
  font-weight: 700;
}

.empty-row {
  padding: 0;
}

.empty-state {
  min-height: 406px;
  display: grid;
  place-items: center;
  align-content: center;
  color: #9aa6be;
}

.empty-state-graphic {
  position: relative;
  width: 166px;
  height: 130px;
}

.empty-orb {
  position: absolute;
  left: 30px;
  top: 4px;
  width: 106px;
  height: 106px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.9), rgba(204, 224, 255, 0.28) 58%, rgba(204, 224, 255, 0.08) 100%);
}

.empty-box-bottom,
.empty-box-left,
.empty-box-right,
.empty-lid-left,
.empty-lid-right,
.empty-plane,
.empty-arrow-left,
.empty-arrow-right {
  position: absolute;
}

.empty-box-bottom {
  left: 54px;
  top: 52px;
  width: 48px;
  height: 34px;
  background: linear-gradient(135deg, #7caeff 0%, #5b8ff8 100%);
}

.empty-box-left {
  left: 46px;
  top: 45px;
  width: 30px;
  height: 26px;
  background: linear-gradient(180deg, #8bb8ff 0%, #6a9eff 100%);
  transform: skewY(18deg);
}

.empty-box-right {
  left: 76px;
  top: 45px;
  width: 32px;
  height: 26px;
  background: linear-gradient(180deg, #6c9eff 0%, #4e81f3 100%);
  transform: skewY(-18deg);
}

.empty-lid-left {
  left: 48px;
  top: 34px;
  width: 32px;
  height: 16px;
  background: linear-gradient(180deg, #8eb8ff 0%, #6a9efc 100%);
  transform: skewX(-24deg) rotate(-7deg);
}

.empty-lid-right {
  left: 74px;
  top: 32px;
  width: 36px;
  height: 16px;
  background: linear-gradient(180deg, #74a7ff 0%, #5b8ef8 100%);
  transform: skewX(24deg) rotate(7deg);
}

.empty-plane {
  right: 24px;
  top: 8px;
  width: 0;
  height: 0;
  border-left: 16px solid #8db7ff;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  transform: rotate(-26deg);
}

.empty-plane::after {
  content: "";
  position: absolute;
  left: -16px;
  top: -3px;
  width: 14px;
  border-top: 2px solid #a8c6ff;
  transform: rotate(-18deg);
}

.empty-arrow-left,
.empty-arrow-right {
  bottom: 20px;
  width: 2px;
  height: 20px;
  background: #9dc0ff;
}

.empty-arrow-left {
  left: 16px;
}

.empty-arrow-right {
  right: 22px;
}

.empty-arrow-left::before,
.empty-arrow-left::after,
.empty-arrow-right::before,
.empty-arrow-right::after {
  content: "";
  position: absolute;
  top: -1px;
  width: 8px;
  height: 2px;
  background: #9dc0ff;
}

.empty-arrow-left::before,
.empty-arrow-right::before {
  left: -2px;
  transform: rotate(-45deg);
}

.empty-arrow-left::after,
.empty-arrow-right::after {
  right: -2px;
  transform: rotate(45deg);
}

.empty-state-title {
  margin-top: 18px;
  color: #4b5b78;
  font-size: 18px;
  font-weight: 800;
}

.empty-state-text {
  margin-top: 10px;
  color: #94a0ba;
  font-size: 16px;
}

.checkout-bar {
  position: relative;
  left: auto;
  right: auto;
  bottom: auto;
  z-index: 20;
  flex: 0 0 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  justify-content: space-between;
  gap: 18px;
  margin: 0 var(--gutter, 30px) 16px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(12px);
  padding: 20px 28px 26px;
  box-shadow: 0 24px 64px rgba(38, 80, 154, 0.12);
}

.pay-method-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
}

.pay-method-label {
  color: #5f6d87;
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
}

.pay-method-options {
  display: flex;
  gap: 10px;
}

.pay-method-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  height: 46px;
  padding: 0 20px;
  border: 1.5px solid #dce3f0;
  border-radius: 12px;
  background: #ffffff;
  color: #44516b;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.pay-method-btn:hover {
  border-color: #558cff;
  color: #558cff;
  background: #f0f5ff;
}

.pay-method-btn.active {
  border-color: #558cff;
  background: linear-gradient(135deg, #558cff 0%, #4044f1 100%);
  color: #ffffff;
  box-shadow: 0 8px 20px rgba(74, 99, 255, 0.22);
}

.summary-block {
  display: flex;
  gap: 22px;
  align-items: center;
}

.summary-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 102px;
  height: 96px;
  border: 1px solid #e4ebf4;
  border-radius: 16px;
  background: #ffffff;
  text-align: center;
}

.round-btn {
  cursor: pointer;
  border: 1px solid #d8e4ff;
  background: linear-gradient(180deg, #f7faff 0%, #eef4ff 100%);
  box-shadow: 0 10px 24px rgba(85, 140, 255, 0.12);
}

.round-btn strong {
  color: #467bff;
}

.round-btn span {
  color: #58709a;
}

.round-btn.disabled {
  cursor: not-allowed;
  opacity: 0.62;
  box-shadow: none;
}

.summary-item strong {
  color: #467bff;
  font-size: 22px;
  line-height: 1.2;
}

.summary-item span {
  margin-top: 10px;
  color: #5f6d87;
  font-size: 14px;
  font-weight: 600;
}

.summary-item:nth-child(2) strong {
  color: #2ea64f;
}

.summary-item.discount strong {
  color: #f14949;
}

.checkout-actions {
  display: flex;
  align-items: center;
  gap: 22px;
  margin-left: auto;
}

.clear-cart-btn {
  min-width: 178px;
  height: 96px;
  padding: 0 22px;
  border-radius: 18px;
  background: #ffffff;
  color: #44516b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 700;
}

.clear-cart-icon {
  color: #4e5f7f;
}

.settle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  min-width: 316px;
  height: 96px;
  padding: 0 30px;
  border: none;
  border-radius: 18px;
  background: linear-gradient(90deg, #558cff 0%, #4044f1 100%);
  color: #ffffff;
  box-shadow: 0 24px 40px rgba(74, 99, 255, 0.28);
  font-size: 20px;
  font-weight: 800;
}

.settle-btn:disabled {
  opacity: 0.56;
  cursor: not-allowed;
  box-shadow: none;
}

.settle-btn-icon,
.settle-btn-arrow {
  font-size: 28px;
  line-height: 1;
  color: rgba(255, 255, 255, 0.92);
}

.member-log-head {
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.member-log-title {
  color: var(--text-strong);
  font-size: 18px;
  font-weight: 800;
}

.member-log-sub {
  color: var(--text-muted);
  font-size: 13px;
}

.member-log-list {
  margin-top: 14px;
  display: grid;
  gap: 10px;
}

.member-log-item {
  border: 1px solid #e7edf5;
  border-radius: 14px;
  background: #fbfcfe;
  padding: 14px 16px;
}

.member-log-top,
.member-log-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.member-log-top {
  align-items: center;
}

.member-log-type {
  color: var(--text-strong);
  font-weight: 700;
}

.member-log-money {
  color: var(--danger);
  font-weight: 800;
}

.member-log-money.income {
  color: #0f9d58;
}

.member-log-meta {
  margin-top: 8px;
  flex-wrap: wrap;
  color: var(--text-muted);
  font-size: 13px;
}

.member-log-memo {
  margin-top: 8px;
  color: #475467;
  font-size: 13px;
  line-height: 1.6;
}

.member-log-empty {
  margin-top: 14px;
  color: var(--text-muted);
  text-align: center;
  padding: 18px 0 10px;
}

.member-log-dialog {
  width: min(760px, calc(100vw - 24px));
  padding: 0;
  overflow: hidden;
}

.member-log-dialog-body {
  max-height: min(70vh, 720px);
  overflow: auto;
  padding: 18px;
}

.pay-password-dialog {
  width: min(420px, calc(100vw - 24px));
  padding: 0;
  overflow: hidden;
}

.pay-password-body {
  padding: 22px 20px 20px;
}

.pay-password-info {
  text-align: center;
  margin-bottom: 18px;
  color: #475467;
  font-size: 15px;
}

.pay-password-amount {
  display: block;
  margin-top: 8px;
  font-size: 28px;
  font-weight: 900;
  color: var(--navy-800);
}

.pay-password-input-row {
  margin-bottom: 18px;
}

.sms-code-wrap {
  display: flex;
  gap: 10px;
  align-items: center;
}

.sms-code-field {
  flex: 1;
  min-width: 0;
}

.sms-send-btn {
  flex: none;
  height: 56px;
  padding: 0 16px;
  border: 1.5px solid #558cff;
  border-radius: 12px;
  background: #ffffff;
  color: #558cff;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.sms-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pay-password-field {
  width: 100%;
  height: 56px;
  border: 1.5px solid #dce4f1;
  border-radius: 12px;
  padding: 0 18px;
  font-size: 20px;
  color: var(--text-strong);
  outline: none;
  background: #ffffff;
  text-align: center;
  letter-spacing: 8px;
  box-sizing: border-box;
}

.pay-password-field::placeholder {
  color: #a0abbd;
  font-size: 15px;
  letter-spacing: normal;
}

.pay-password-field:focus {
  border-color: #558cff;
}

.pay-password-confirm-btn {
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #558cff 0%, #4044f1 100%);
  color: #ffffff;
  font-size: 17px;
  font-weight: 800;
  box-shadow: 0 12px 24px rgba(74, 99, 255, 0.22);
}

.pay-password-confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.pricing-mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  background: rgba(7, 20, 39, 0.42);
  backdrop-filter: blur(3px);
}

.pricing-dialog {
  width: min(360px, calc(100vw - 24px));
  padding: 0;
  overflow: hidden;
}

.pricing-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid #edf1f6;
  color: var(--text-strong);
  font-size: 18px;
  font-weight: 800;
}

.pricing-close {
  border: none;
  background: transparent;
  color: #344054;
  font-size: 28px;
  line-height: 1;
}

.pricing-tabs {
  display: flex;
  gap: 10px;
  padding: 14px 18px 0;
}

.pricing-tab {
  flex: 1;
  height: 42px;
  border: 1px solid #d9e2ef;
  border-radius: 12px;
  background: #f8fafc;
  color: #4b5563;
  font-size: 16px;
  font-weight: 700;
}

.pricing-tab.active {
  color: #ffffff;
  border-color: #315cf0;
  background: linear-gradient(135deg, #4f87ff 0%, #315cf0 100%);
}

.pricing-input-row {
  display: block;
  padding: 18px;
}

.pricing-display {
  position: relative;
}

.pricing-input {
  width: 100%;
  height: 68px;
  border: 1px solid #d6e0ef;
  border-radius: 16px;
  padding: 0 48px 0 18px;
  font-size: 26px;
  font-weight: 700;
  color: var(--text-strong);
  outline: none;
  background: #f8fbff;
}

.pricing-unit {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--navy-900);
  font-size: 16px;
  font-weight: 800;
}

.pricing-preview {
  padding: 0 18px 12px;
  display: grid;
  gap: 10px;
  color: #475467;
  font-size: 14px;
}

.pricing-summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 14px;
  background: #f8fbff;
  border: 1px solid #e1e9f5;
}

.pricing-summary-card.confirm {
  background: linear-gradient(180deg, #f7faff 0%, #eef4ff 100%);
}

.pricing-summary-label {
  color: #6a7c99;
  font-size: 13px;
  font-weight: 700;
}

.pricing-tip {
  color: #6a7c99;
  line-height: 1.5;
}

.pricing-error {
  color: #e05353;
  font-weight: 700;
}

.pricing-keypad {
  padding: 0 18px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.pricing-keypad button,
.pricing-keypad-bottom button {
  height: 66px;
  border: 1px solid #d4dce7;
  border-radius: 12px;
  background: #ffffff;
  color: #344054;
  font-size: 22px;
  font-weight: 700;
}

.pricing-keypad-bottom {
  padding: 10px 18px 18px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.pricing-keypad-bottom .backspace-key,
.pricing-keypad-bottom .clear-key {
  font-weight: 700;
  font-size: 16px;
}

.pricing-keypad-bottom .backspace-key {
  color: #6a7c99;
}

.pricing-keypad-bottom .clear-key {
  color: #d14b4b;
}

.pricing-keypad-bottom .confirm-key {
  background: linear-gradient(135deg, #4f87ff 0%, #315cf0 100%);
  border-color: #315cf0;
  color: #ffffff;
  font-size: 18px;
  font-weight: 800;
}

@media (max-width: 1100px) {
  .search-grid {
    grid-template-columns: 1fr;
  }

  .checkout-bar {
    flex-direction: column;
  }

  .checkout-actions {
    margin-left: 0;
    justify-content: space-between;
  }

  .member-group {
    justify-content: flex-start;
  }
}

@media (max-width: 720px) {
  .cashier-main {
    padding: 12px 12px 16px;
  }

  .search-panel {
    padding: 20px 16px 18px;
  }

  .scan-group,
  .member-group,
  .summary-block,
  .checkout-actions {
    flex-wrap: wrap;
  }

  .scan-group {
    align-items: stretch;
  }

  .scan-input-shell,
  .member-input-shell {
    width: 100%;
  }

  .hero-search-btn,
  .member-search-btn,
  .quick-pick-card,
  .clear-cart-btn,
  .settle-btn {
    width: 100%;
  }

  .quick-pick-card {
    height: 72px;
    flex-direction: row;
  }

  .summary-block {
    width: 100%;
    justify-content: space-between;
  }

  .summary-item {
    flex: 1;
    min-width: 0;
  }

  .checkout-bar {
    margin: 0 12px 12px;
    padding: 18px 16px;
  }

  .search-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .selected-member-pill {
    width: 100%;
    flex-wrap: wrap;
  }

  .member-recharge-inline {
    width: 100%;
  }

  .member-recharge-input,
  .member-recharge-inline button {
    width: 100%;
  }
}
</style>
