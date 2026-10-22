# `custom/comment-style`

按导出语义决定注释符号：`export` 上方用 `/** */` 文档注释，非导出位置单行用 `//`、多行或多段用 `/* */`，注释独占目标代码上方一行。

## 为什么

文档注释会被编辑器悬停与类型提示读取，是写给调用方的；文件内部的说明只给读实现的人看。符号跟着导出语义走，读者看到 `/** */` 就知道这是对外契约。注释拖在代码尾部会被格式化挤断，也容易在改代码时漏改。

## 示例

```ts
// ✅ 导出用文档注释，内部用行注释
/** 剥离业务信封后只返回 data */
export const createRequest = () => {};

// 循环外生成，保证重试共用同一个 requestId
const requestId = generateRequestId();

// ❌ 导出上方用行注释；注释拖在代码尾部
// 剥离业务信封后只返回 data
export const createGetRequest = () => {};
const timeoutMs = 3000; // 默认超时
```

`eslint-disable`、`@ts-expect-error`、`/// <reference>` 这类工具指令，以及 `foo(/* name */ 'bar')` 这类内联参数注释不受约束。

## 选项

无。可自动修复：符号改写与相邻多段注释合并。
