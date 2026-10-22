# `custom/ref-suffix-naming`

`useRef` 返回的变量名以 `Ref` 结尾，如 `inputRef`、`timerRef`。

## 为什么

ref 与普通状态的读法不同：取值要走 `.current`，改它也不会触发渲染。名字带 `Ref` 后缀，读者一眼就知道该怎么用它；不带后缀时读起来像普通值，容易直接拿来渲染或放进依赖数组。

社区的 `@eslint-react/naming-convention-ref-name` 放行裸 `ref`，所以保留本规则。

## 示例

```tsx
// ✅ Ref 结尾
const inputRef = useRef<HTMLInputElement>(null);
const timerRef = useRef<number | null>(null);

// ❌ 缺后缀，读起来像普通值
const input = useRef<HTMLInputElement>(null);
const ref = useRef(0);
```

## 选项

无。生效范围：`src/` 下的 ts / tsx。
