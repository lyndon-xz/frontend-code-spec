---
description: 规定一个函数用一句话能说完，并且只做编排或只做细节
---

# 函数

## 1、一个函数用一句话能说完它做什么

为什么：取数、换算和埋点塞在同一个叫计算的函数里，副作用的触发时机就不可预期。

```ts
// ✅ 算应付金额只做减法
const payable = (order: Order) => {
  const { total, discount } = order;
  return total - discount;
};
// ❌ 算金额的函数里顺手埋点
const payable = async (order: Order) => {
  const { total, discount, id } = order;
  const amount = total - discount;
  report(id);
  return amount;
};
```

边界：判据是能不能用一句话概括，不是行数。

## 2、一个函数只做编排，或只做细节

为什么：高层步骤和字符串拼接写在一起，读的人要在主流程和实现之间来回跳。

```ts
// ✅ 主体只调用有名字的步骤
const submit = async (order: Order) => {
  await pay(payable(order));
  report(order.id);
};
// ❌ 编排函数里直接拼上报文案、直接改存储
const submit = async (order: Order) => {
  const { total, discount, id } = order;
  const amount = total - discount;
  await pay(amount);
  report(`订单 ${id} 已支付`);
  storage.set('last-order', id);
};
```

边界：编排函数的函数体是在调用步骤。细节留在那些步骤里。
