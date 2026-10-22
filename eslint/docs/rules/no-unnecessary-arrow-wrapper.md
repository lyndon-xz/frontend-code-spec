# `custom/no-unnecessary-arrow-wrapper`

JSX 事件属性里只转调一个函数的箭头包裹是多余的，`onClick={() => fn()}` 直接写成 `onClick={fn}`。

## 为什么

多一层箭头函数不增加任何信息，读者还要确认它有没有改参数、有没有吞掉事件。直接传函数引用，属性读起来就是 “点击时执行 fn”。

## 示例

```tsx
// ✅ 直接传函数
<Button onClick={saveDraft} />
<Input onChange={updateKeyword} />

// ❌ 只是原样转调
<Button onClick={() => saveDraft()} />
<Input onChange={(event) => updateKeyword(event)} />
```

确实要丢弃事件参数时 (被调函数有可选形参，不想让事件对象落进去)，保留包裹。

## 选项

无。只报不修：去掉包裹后，发射方多传的实参会静默落进被调函数的可选形参，行为可能改变，需要人工确认。生效范围：tsx。
