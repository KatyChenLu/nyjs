import { formatMoney } from "../services/api.js";

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function printReceipt(payload = {}) {
  const popup = window.open("", "_blank", "width=420,height=760");
  if (!popup) {
    window.alert("请允许浏览器打开打印窗口");
    return;
  }

  const lines = Array.isArray(payload.lines) ? payload.lines : [];
  const totals = Array.isArray(payload.totals) ? payload.totals : [];

  popup.document.write(`
    <!doctype html>
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(payload.title || "收银小票")}</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 18px; color: #111827; font: 14px/1.55 "PingFang SC", "Microsoft YaHei", sans-serif; }
          h1 { margin: 0 0 8px; font-size: 20px; }
          .meta { margin-bottom: 12px; color: #4b5563; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: left; }
          th:last-child, td:last-child { text-align: right; }
          .totals { margin-top: 12px; padding-top: 8px; border-top: 2px solid #111827; }
          .total-row { display: flex; justify-content: space-between; margin-top: 6px; }
          .footer { margin-top: 14px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(payload.title || "汇泽农业收银小票")}</h1>
        <div class="meta">
          <div>门店：${escapeHtml(payload.shopName || "当前门店")}</div>
          <div>时间：${escapeHtml(payload.time || "")}</div>
          <div>单号：${escapeHtml(payload.orderSn || "-")}</div>
          <div>收银员：${escapeHtml(payload.cashierName || "-")}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>商品</th>
              <th>数量</th>
              <th>单价</th>
              <th>小计</th>
            </tr>
          </thead>
          <tbody>
            ${lines.map((item) => `
              <tr>
                <td>${escapeHtml(item.name)}</td>
                <td>${escapeHtml(item.qty)}</td>
                <td>¥${formatMoney(item.price)}</td>
                <td>¥${formatMoney(item.amount)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div class="totals">
          ${totals.map((item) => `
            <div class="total-row">
              <span>${escapeHtml(item.label)}</span>
              <strong>${escapeHtml(item.value)}</strong>
            </div>
          `).join("")}
        </div>
        <div class="footer">${escapeHtml(payload.footer || "感谢惠顾")}</div>
      </body>
    </html>
  `);

  popup.document.close();
  popup.focus();
  window.setTimeout(() => popup.print(), 180);
}
