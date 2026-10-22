# `custom/require-unit-suffix`

类型成员里的数值量纲字段必须带单位后缀，如 `fee` 写作 `feeCents`、`timeout` 写作 `timeoutMs`。只检查类型成员，局部变量与参数不查。

## 为什么

类型成员是跨端传递的契约。金额是分还是元、时长是毫秒还是秒，只写在注释里迟早会被另一端误解，而单位错一档就是百倍、千倍的偏差。后缀把单位钉在名字上，每个使用点都看得见。

## 示例

```ts
// ✅ 单位写在名字上
interface Order {
  feeCents: number;
  timeoutMs: number;
}

// ❌ 单位只能靠猜
interface Order {
  fee: number;
  timeout: number;
}
```

默认量纲与可用后缀：

- 金额：`Cents`、`Yuan`
- 时长：`Ms`、`Seconds`、`Minutes`、`Hours`、`Days`
- 时间点：`Ms`、`Seconds`、`Iso`、`Utc`
- 长度：`Px`、`Rem`、`Percent`、`Meters`、`Km`
- 数据量：`Bytes`、`Kb`、`Mb`
- 质量：`Grams`、`Kg`

`price`、`createdAt`、裸 `size` 与 `length` 不在默认词根内。

## 选项

- `dimensions`：量纲列表，每项 `{ name, roots, suffixes }`，覆盖默认值。
- `ignoredFields`：放行的字段名，默认 `[]`。
- 生效范围：`src/` 下的 ts / tsx。
