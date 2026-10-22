# `custom/no-generic-param-name`

函数参数不用 `data`、`callback` 这类空泛占位名，改用具体的领域词汇。只按整名匹配，`userData`、`dataSource` 这类带领域词的复合名放行。

## 为什么

泛化名把 “传的是什么” 藏起来，调用处和函数体都读不出业务含义，读者被迫跳进实现或类型定义才能确认。参数名是函数签名里最先被读到的信息，值得用领域词说清楚。

## 示例

```ts
// ✅ 参数名说明传的是什么
const formatHotel = (hotel: Hotel) => hotel.name;
const subscribe = (onChange: () => void) => {};

// ❌ 泛化占位名，语义靠猜
const formatHotel = (data: Hotel) => data.name;
const subscribe = (callback: () => void) => {};
```

## 选项

```js
'custom/no-generic-param-name': ['error', { bannedNames: ['data', 'callback'] }]
```

- `bannedNames`：禁用的整名列表，默认 `['data', 'callback']`，至少一项。

生效范围：js / ts / tsx。
