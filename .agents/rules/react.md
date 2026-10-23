---
description: 规定组件何时拆、分支怎么返回，以及 ref、记忆化和容错怎么用
paths:
  - '**/*.jsx'
  - '**/*.tsx'
  - '**/use[A-Z]*.js'
  - '**/use[A-Z]*.ts'
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

## 3、条件渲染出来的 ref，effect 的依赖包含那个渲染条件

为什么：依赖数组写全由工具检查，但它看不到条件渲染。挂载时元素还不在，effect 读到空引用就返回，元素出现后也不会再绑。

```tsx
// ✅ 是否渲染哨兵，和 effect 是否绑定，用同一个条件
const showSentinel = !isLoading && hasMore;
useEffect(() => {
  const el = sentinelRef.current;
  if (!showSentinel || !el) {
    return;
  }
}, [showSentinel]);
// ❌ effect 只依赖 ref，首屏没有哨兵之后就再也不绑定
useEffect(() => {
  const el = sentinelRef.current;
  if (!el) {
    return;
  }
}, [sentinelRef]);
```

边界：渲染条件和 effect 里的判断是同一个表达式。Hook 只在顶层调用、依赖数组写全、列表 key 用稳定标识，由工具报错。

## 4、useCallback 和 useMemo 只用于传给 memo、作为 effect 依赖或昂贵计算

为什么：包住只在点击时调用的函数，比较引用的成本高于省下的那次创建。

```tsx
// ✅ 传给 memo 子组件的回调才保持引用
const removeStay = useCallback((stayId: string) => deleteStay(stayId), [deleteStay]);
// ❌ 只写在按钮点击上的函数也包了一层
const onRemove = useCallback(() => deleteStay(stayId), [deleteStay, stayId]);
```

边界：useCallback 用于传给 memo 子组件，或作为 effect 和其他 Hook 的依赖。useMemo 用于大数组的排序和聚合，或作为 effect 依赖、传给 memo 子组件的对象和数组。简单拼接不用。

## 5、从状态取值的函数是普通函数，缓存交给 useMemo

为什么：输入是整块状态的缓存一次也不会命中，读的人却会以为引用已经稳定，把外面的比较删掉。

```ts
// ✅ 取到的是数组里那个对象的原引用
const selectStay = (state: State) => {
  const { stays, selectedStayId } = state;
  return stays.find((stay) => stay.id === selectedStayId) ?? null;
};
// ❌ 输入是整页状态，返回一个新对象，缓存不会命中
const selectStay = (state: State) => {
  const { stays, selectedStayId } = state;
  return {
    stay: stays.find((item) => item.id === selectedStayId) ?? null,
    total: stays.length,
  };
};
```

边界：要同时满足三点才值得做选择器缓存：返回新建的对象或数组，结果参与订阅比较，输入能细到字段。缺一点就写成普通函数。

## 6、ref 只存放不触发渲染的值

为什么：写进 ref 的计数不会让界面更新，用户看到的仍是旧值。

```tsx
// ✅ 定时器标识不参与渲染
const timerRef = useRef<number | null>(null);
// ❌ 用 ref 保存点击次数，数字变了界面不变
const clickCountRef = useRef(0);
clickCountRef.current += 1;
```

边界：元素引用、跨渲染要保留的可变值、第三方实例，用 ref。会改变界面的状态用 state。变量名以 Ref 结尾由工具检查。

## 7、渲染异常交给顶层 Error Boundary

为什么：组件里用 try 包住返回的元素，崩溃被吞掉，外层不知道这次渲染失败了。

```tsx
// ✅ 页面外包一层容错边界
<ErrorBoundary>
  <Page />
</ErrorBoundary>;
// ❌ 渲染函数里 catch 之后返回空
try {
  return <Page />;
} catch {
  return null;
}
```

边界：容错边界放在顶层。请求失败不靠接住渲染异常来展示。
