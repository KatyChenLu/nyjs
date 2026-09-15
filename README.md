# 农友收银 H5

## 启动

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 已接入的店铺端接口

- `shop/user/login`
- `shop/sms/send`
- `shop/index/typeSelect`
- `shop/index/goodsList`
- `shop/index/getGoodsByBarcode`
- `shop/index/getUserByMobile`
- `shop/index/recharge`
- `shop/index/settlement`

## 页面

- 登录页
- 首页
- 收银页
- 自提订单页

## 说明

- 扫码枪接入方式：H5 通过键盘事件监听高速输入并在回车后识别为扫码。
- 接口基础地址默认值为 `https://www.hznongye.com`，也可以在登录页手动修改。
- `# 店铺端` 文档未提供自提订单相关接口，因此自提页当前使用本地示例数据承接原型和扫码核销流程。
