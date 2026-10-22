# `custom/no-internal-on-prefix`

`on` 前缀只留给 Props 回调的声明与透传，组件或模块内部定义的函数改用说明动作的动词。

## 为什么

`onSelect`、`onChange` 在本仓专指 “由外部传进来的回调”。内部函数也叫 `onSave`，读者就分不清它是自己实现的逻辑还是父组件给的回调，追调用链时会找错方向。

## 示例

```tsx
// ✅ Props 回调用 on，内部函数用动词
interface FlightCardProps {
  onSelect: (flightId: string) => void;
}

const FlightCard = (props: FlightCardProps) => {
  const { onSelect } = props;
  const selectFlight = () => onSelect('MU5101');

  return <button onClick={selectFlight}>选择</button>;
};

// ❌ 内部函数也用 on 前缀
const onSave = () => saveDraft();
```

测试与 mock 文件豁免。

## 选项

无。生效范围：js / ts / tsx。
