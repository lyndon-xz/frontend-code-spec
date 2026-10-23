---
description: 规定悬停、聚焦和按下用伪类，组件自己的样式块顺序对齐标记
paths:
  - '**/*.scss'
  - '**/*.css'
---

# 样式

## 1、悬停、聚焦和按下写在伪类里

为什么：为这三种反馈记一份脚本状态，要经过状态、事件和属性选择器，效果和一行伪类一样，还多一次渲染。

```scss
// ✅ 纯视觉反馈写在伪类上
.card:hover {
  background: var(--card-hover);
}
// ❌ 用鼠标事件改一个类名，只为了做悬停变色
const [hovered, setHovered] = useState(false);
<button
  className={hovered ? 'card cardHover' : 'card'}
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
/>
```

边界：选中、勾选、禁用和展开由数据决定，别处也要读，用数据属性，不用伪类假装。颜色、间距、圆角、层叠、嵌套层数、类名和声明顺序由工具报错。一次性、只属于单个元素的微调可以保持字面量，反复出现的字号收成变量。

## 2、组件自己的样式块按标记结构排列，容器紧挨子项

为什么：次序和标记对不上时，改一块样式要按类名搜。漏写的样式和已删节点留下的样式，对着标记也看不出来。

```scss
// ✅ 容器紧挨自己的子项，加载沉到末尾
.card {
  padding: var(--space-m);
}
.head {
  margin-bottom: var(--space-s);
}
.title {
  margin-bottom: var(--space-s);
}
.loading {
  padding: var(--space-m);
}
// ❌ 文本类堆在一起，容器和子项被拆开
.title {
  margin-bottom: var(--space-s);
}
.price {
  margin-bottom: var(--space-s);
}
.card {
  padding: var(--space-m);
}
.head {
  margin-bottom: var(--space-s);
}
```

边界：只排这个组件自己的样式文件，对照同目录标记的深度优先顺序。全局样式、token、被多处共用的类不按某一份标记排。同一个类按首次出现写一次。加载、失败和空这些早返回用的类放在文件末尾。块内声明的先后由工具报错。
