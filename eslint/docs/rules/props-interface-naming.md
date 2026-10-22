# `custom/props-interface-naming`

组件的 Props 接口命名为 “组件名 + Props”，如 `FlightCard` 的接口叫 `FlightCardProps`。

## 为什么

组件与 Props 按名字一一对应，搜组件名就能找到它的入参契约；同一目录里多个组件时，也不会出现几个都叫 `Props` 的接口。

## 示例

```tsx
// ✅ 组件名 + Props
interface FlightCardProps {
  flightNo: string;
}

const FlightCard = (props: FlightCardProps) => <span>{props.flightNo}</span>;

// ❌ 与组件名对不上
interface CardProps {
  flightNo: string;
}

const FlightCard = (props: CardProps) => <span>{props.flightNo}</span>;
```

## 选项

无。可自动修复未导出的接口；已导出的接口只报不修，改名会让导入方编译失败。生效范围：tsx。
