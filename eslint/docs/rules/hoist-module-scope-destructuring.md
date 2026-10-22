# `custom/hoist-module-scope-destructuring`

对模块级 `const` 绑定的解构写在函数体内时报错，要求提到模块顶层 (import 之后、函数之前)。

## 为什么

模块级 `const` 从模块求值那一刻就固定了，比如对象形态的 actions。把它的解构放进组件体，会和 `useXxxModel()` 那几行并列，暗示它随渲染变化。提到顶层后，组件体只剩渲染真正依赖的东西。

## 示例

```tsx
// ✅ 模块级常量在顶层解构
const { fetchHotels, resetFilters } = hotelActions;

const HotelList = (props: HotelListProps) => {
  const { cityId } = props;

  return <List onRefresh={() => fetchHotels(cityId)} onReset={resetFilters} />;
};

// ❌ 模块级常量的解构写在组件体内
const HotelList = (props: HotelListProps) => {
  const { fetchHotels, resetFilters } = hotelActions;

  return <List onReset={resetFilters} />;
};
```

可重新赋值的 `let` 绑定不报：提到顶层会改变求值时机，读到的可能是旧值。

## 选项

无。只报不修。生效范围：js / ts / tsx。
