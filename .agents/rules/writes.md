---
description: 规定批量写入按项给出结果，重跑会多出数据的写操作要锁住或带幂等标识
---

# 写入

## 1、批量操作的返回值按项给出结果

为什么：一项失败就整批抛错，已经成功的会被重试再写一遍。只说部分失败，调用方不知道是哪一项。

```ts
// ✅ 逐项写入，失败项保留自己的原因
const results = await Promise.all(
  items.map(async (item) => {
    try {
      await write(item);
      return { id: item.id, ok: true };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown';
      return { id: item.id, ok: false, reason };
    }
  }),
);
// ❌ Promise.all 第一项失败就整批拒绝，其余结果被丢掉
const results = await Promise.all(items.map((item) => write(item)));
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
