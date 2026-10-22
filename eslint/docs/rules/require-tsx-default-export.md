# `custom/require-tsx-default-export`

`.tsx` 文件必须有 `export default`，导出文件的主组件。与之相对，`.ts` 文件由 `import-x/no-default-export` 要求只用具名导出。

## 为什么

组件文件只有一个主体，默认导出是它的唯一入口，引用处更简洁；逻辑文件可能导出多份能力，具名导出能保证同一份逻辑在全仓用同一个名字被引用，搜得到全部消费方。两个方向各由一条规则守住。

## 示例

```tsx
// ✅ 组件文件默认导出主组件，类型可以具名导出
export interface FlightCardProps {
  flightNo: string;
}

const FlightCard = (props: FlightCardProps) => <span>{props.flightNo}</span>;

export default FlightCard;

// ❌ 只有具名导出
export const FlightCard = (props: FlightCardProps) => <span>{props.flightNo}</span>;
```

`import-x/prefer-default-export` 在文件含类型导出或 `export *` 时不报，所以保留本规则。测试文件豁免。

## 选项

无。生效范围：`src/` 下的 tsx。
