# `custom/status-field-naming`

状态上下文里的异步状态字段用 “数据名在前” 的形式：加载态写 `isLoadingHotels`，错误写 `hotelsError`，不写 `loadingHotels`、`errorHotels`。

## 为什么

每条异步流程要有自己的一组状态字段，名字指向它服务的那份数据。数据名在前时，`hotels`、`isLoadingHotels`、`hotelsError` 读起来是一组；前缀式的 `loadingHotels` 与 `loadingOrders` 混在一起，并发多流程时容易互相覆盖、读错。

## 示例

```ts
// ✅ 每条流程独立，字段名指向它的数据
interface HotelState {
  hotels: Hotel[];
  isLoadingHotels: boolean;
  hotelsError: Error | null;
}

// ❌ 前缀式
interface HotelState {
  loadingHotels: boolean;
  errorHotels: Error | null;
}
```

只在状态上下文里检查：`useState` 声明、名字以 `State` 结尾的类型成员与状态对象字面量。`errorMessage`、`loadingText` 这类命名对象自身属性的字段放行。

## 选项

无。生效范围：`src/` 下的 ts / tsx。
