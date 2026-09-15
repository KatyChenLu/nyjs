import { createRouter, createWebHashHistory } from "vue-router";
import { authStore } from "./services/api.js";
import LoginView from "./views/LoginView.vue";
import HomeView from "./views/HomeView.vue";
import CashierView from "./views/CashierView.vue";
import PickupView from "./views/PickupView.vue";
import HistoryView from "./views/HistoryView.vue";
import MaterialApplyView from "./views/MaterialApplyView.vue";
import MemberReportView from "./views/MemberReportView.vue";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", redirect: "/cashier" },
    { path: "/login", name: "login", component: LoginView, meta: { public: true } },
    { path: "/home", name: "home", component: HomeView },
    { path: "/cashier", name: "cashier", component: CashierView },
    { path: "/pickup", name: "pickup", component: PickupView },
    { path: "/material-apply", name: "material-apply", component: MaterialApplyView },
    { path: "/history", name: "history", component: HistoryView },
    { path: "/member-report", name: "member-report", component: MemberReportView },
  ],
});

router.beforeEach((to) => {
  if (to.meta.public) {
    if (to.name === "login" && authStore.hasToken()) {
      return { name: "cashier" };
    }
    return true;
  }
  if (!authStore.hasToken()) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
  return true;
});

export default router;
