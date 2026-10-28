---
description: 规定类型贴着业务对象，取值只有一个源，外部值在入口收窄
paths:
  - '**/*.ts'
  - '**/*.tsx'
---

# TypeScript

## 1、类型名和成员用这个业务对象的说法

为什么：string 和 number 拼出来的别名，读的人看不出约束的是什么。

```ts
// ✅ 联合成员是业务里的两种主题
type Theme = 'light' | 'dark';
// ❌ 类型名叫 Data，成员是没有含义的 a 和 b
type Data = { a: string; b: number };
```

边界：对象结构用 interface、联合与映射用 type，对象结构这一半由工具检查。禁 any；外部值收窄不用 `as` 绕过校验，`as` 只用于已知类型的窄化；条件必须是布尔、switch 覆盖全部分支、枚举写明取值、索引结果按可能缺失处理、每个分支都有返回，这些由工具报错。

## 2、一组取值只声明一次，类型从它派生

为什么：手写一份联合再抄一份数组，加一个取值只会改到其中一处。查表用记录类型，少一个键会在编译期被点名。

```ts
// ✅ 数组是唯一来源，类型和文案表都从它来
const SORT_BY_VALUES = ['price', 'rating', 'distance'] as const;
type SortBy = (typeof SORT_BY_VALUES)[number];
// ❌ 联合和数组各写一遍，遍历时再抄第三份
type SortBy = 'price' | 'rating' | 'distance';
const SORT_BY_VALUES = ['price', 'rating'];
const labels = ['价格', '评分', '距离'];
```

边界：服务端契约和从不出接口的判别态用枚举。本侧定义、又需要遍历的取值用常量断言数组。展示文案留在界面层，同样用记录类型承接，这样缺一项会报错。

## 3、衍生类型从同一个源用工具类型裁出来

为什么：把字段再手写进一个请求类型，基座改了字段，请求类型不会跟着变。

```ts
// ✅ 创建请求去掉服务端生成的字段
type CreateStayRequest = Omit<Stay, 'id' | 'createdAt'>;
// ❌ 再声明一个接口，把 name 和 email 抄一遍
interface CreateStayRequest {
  name: string;
  email: string;
}
```

边界：裁剪用 Pick、Omit、Partial。两处字段碰巧同名、却不是同一个业务对象的，分开声明。

## 4、进系统的外部值在入口收窄，非法值降到合法默认

为什么：地址参数、接口响应、存储和 postMessage 读出来的值，联合类型拦不住。原样放进去，非法筛选会安静地得到一个空列表。

```ts
// ✅ 守卫引用同一份取值数组，对不上就用默认排序
const sortBy = raw !== null && isSortBy(raw) ? raw : defaultSortBy;
// ❌ 另抄一份合法值，或直接断言成排序类型
const sortBy = raw as SortBy;
```

边界：守卫引用同一份取值来源，不另写一份字面量。收窄失败就降到一个合法值，不原样写入状态。未知键用查询判断，不按一定存在去取。Node 侧的环境变量、命令参数、配置文件和请求体同样在入口收窄。
