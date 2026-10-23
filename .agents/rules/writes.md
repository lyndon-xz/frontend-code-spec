---
description: 规定批量写入按项给出结果，重跑会多出数据的写操作要锁住或带幂等标识
---

# 写入

## 1、批量操作的返回值按项给出结果

为什么：一项失败就整批抛错，已经成功的会被重试再写一遍。只说部分失败，调用方不知道是哪一项。

```ts
// ✅ 每一项都有自己的结果
return items.map((item) => {
  const { id, ok, reason } = item;
  return { id, ok, reason };
});
// ❌ 第一项失败就抛错，其余结果被丢掉
const failed = items.find((item) => item.ok === false);
if (failed) {
  throw new Error(failed.reason);
}
```

边界：这条只看返回值能不能点名每一项。

## 2、重跑会多出一份数据的写操作在进行中锁住，或带幂等标识

为什么：下单、支付、扣库存和状态流转重跑一次，就是一份多出来的数据。

```ts
// ✅ 进行中直接返回，请求带业务单号
if (submitting) {
  return;
}
await submitOrder({ orderId, idempotencyKey: orderId });
// ❌ 连点两次发出两笔没有标识的提交
await submitOrder({ orderId });
await submitOrder({ orderId });
```

边界：判据是重跑会不会多一份数据。重复上报不产生新数据，不归这条。
