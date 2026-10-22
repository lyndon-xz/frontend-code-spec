# `custom/no-handle-prefix`

函数与函数型变量不用 `handle` 前缀，改用说明动作的动词。覆盖函数声明、函数型变量 (含 `useCallback` 包裹)、类方法与箭头字段、对象方法。

## 为什么

`handle` 不表达任何业务动作，只表达 “这里有个处理器”。`handleClick`、`handleChange`、`handleSubmit` 堆在一个文件里彼此无法区分，读者只能跳进函数体看它到底做什么。

## 示例

```ts
// ✅ 语义化动词，读名字就知道干什么
const saveDraft = () => {};
const switchTab = (tabKey: TabKey) => {};

// ❌ handle 前缀，一屏三个 handleXxx 无法区分
const handleClick = () => {};
const handleChange = useCallback(() => {}, []);
```

名词属性不受约束：`handleId` 指句柄或账号，不是函数值，不报。测试与 mock 文件豁免，桩函数常按被替换回调的原名声明。

## 选项

无。生效范围：js / ts / tsx。
