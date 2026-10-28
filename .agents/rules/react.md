---
description: 规定组件何时拆开，以及互斥分支怎么返回
paths:
  - '**/*.jsx'
  - '**/*.tsx'
---

# React

## 1、JSX 超过 200 行、同一结构出现两次、自带独立交互或要单独控制渲染时拆开

为什么：同一段结构贴两遍，改一处会漏另一处。交互逻辑混在页面里，页面的返回值就不再是一条主路径。

```tsx
// ✅ 重复的一行抽成子组件
{
  stays.map((stay) => <StayCard key={stay.stayId} stay={stay} />);
}
// ❌ 同一段卡片标记在两个分支里各写一遍
const { name } = stay;
{
  isOpen ? (
    <article>
      <h2>{name}</h2>
    </article>
  ) : (
    <article>
      <h2>{name}</h2>
    </article>
  );
}
```

边界：四个条件命中一个就拆：返回的 JSX 超过 200 行，同一结构出现两次，自带独立交互，或需要单独控制渲染。只为凑行数拆开、拆完没有自己的数据或交互，就留在原处。

## 2、三个及以上互斥分支用早返回

为什么：三元链把正常路径推到最深处，读的人要数括号才知道自己在哪一层。

```tsx
// ✅ 加载、失败和空各自返回，内容留在最后
if (status === 'loading') {
  return <p>加载中</p>;
}
return <StayList stays={stays} />;
// ❌ 加载、失败和内容写成一条三元链
return status === 'loading' ? (
  <p>加载中</p>
) : status === 'error' ? (
  <p>加载失败</p>
) : (
  <StayList stays={stays} />
);
```

边界：只有一个分支时用逻辑与，两个分支用三元。映射对象只适合每个分支都是纯视图的情况。有守卫就用早返回。在 ts、tsx 里，数字或字符串被当成条件由工具报错。
