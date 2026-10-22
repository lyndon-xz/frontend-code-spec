# `custom/no-param-destructuring`

函数签名里只写完整形参名，解构放到函数体首部。覆盖普通函数、箭头函数、React 组件与 hooks。

## 为什么

在签名里铺开字段有三处代价：加字段就要改签名，字段一多参数列表被折成多行、类型标注挤在一起；解构行没地方写注释，重命名的理由无处安放；丢掉 `props` 这类整体名，需要整体转发或调试打印时得重新拼回去。

## 示例

```tsx
// ✅ 签名保留整体名，函数体首部解构
const HotelCard = (props: HotelCardProps) => {
  const { hotel, isFavorite } = props;

  return <Card title={hotel.name} isActive={isFavorite} />;
};

// ❌ 解构写进签名
const HotelCard = ({ hotel, isFavorite }: HotelCardProps) => {
  return <Card title={hotel.name} isActive={isFavorite} />;
};
```

数组回调同样适用：`entries.map((entry) => { const [key, value] = entry; ... })`。

## 选项

无。生效范围：js / ts / tsx。
