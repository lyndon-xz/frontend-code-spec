import tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/comment-style.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('comment-style', rule, {
  valid: [
    {
      name: '导出声明上方使用 /** */ 文档注释',
      code: '/** 导出的常量 */\nexport const foo = 1;',
    },
    {
      name: '非导出代码使用 // 行注释',
      code: '// 内部实现\nconst x = 1;',
    },
    {
      name: '含 @ 标签的 JSDoc 块注释被放行',
      code: '/** @deprecated 旧接口 */\nexport const y = 2;',
    },
    {
      name: 'eslint 指令注释被放行',
      code: '// eslint-disable-next-line no-console\nconsole.log(1);',
    },
    {
      name: 'prettier 指令注释被放行',
      code: '// prettier-ignore\nconst x = 1;',
    },
    {
      name: '@ts- 指令注释被放行',
      code: '// @ts-nocheck\nconst y = 1;',
    },
    {
      name: '三斜线指令注释（以 / 开头）被放行',
      code: '/// <reference types="node" />\nconst z = 1;',
    },
    {
      name: '内联参数块注释被放行',
      code: "foo(/* name */ 'bar');",
    },
    {
      name: '被注释掉的代码（行首像语句）被放行',
      code: '// const dead = 1;\nexport const alive = 2;',
    },
    {
      name: '被注释掉的代码（行首像「标识符(...)」调用）被放行',
      code: '// doStuff();\nexport const alive = 2;',
    },
    {
      name: '被注释掉的代码（以 } / ; 结尾）被放行',
      code: '// };\nexport const alive = 2;',
    },
  ],
  invalid: [
    {
      name: '导出声明上方的单行注释必须转成 /** */',
      code: '// 导出的常量\nexport const foo = 1;',
      output: '/** 导出的常量 */\nexport const foo = 1;',
      errors: [{ message: '导出声明的注释必须使用 `/** */` 文档注释格式' }],
    },
    {
      name: '非导出代码的块注释必须转成 //',
      code: '/* 内部实现 */\nconst x = 1;',
      output: '// 内部实现\nconst x = 1;',
      errors: [{ message: '非导出代码的注释必须使用 `//` 行注释格式' }],
    },
    {
      name: '尾随注释必须移到目标代码上方独占一行',
      code: 'const x = 1; // 尾随注释',
      output: '// 尾随注释\nconst x = 1;',
      errors: [{ message: '通用注释必须写在目标代码上方独占一行' }],
    },
    {
      name: '导出上方多段注释应合并为一个 /** */',
      code: '// 第一段\n// 第二段\nexport const foo = 1;',
      output: '/**\n * 第一段\n * 第二段\n */\nexport const foo = 1;',
      errors: [{ message: '导出上方的多段注释应合并为一个 `/** */` 文档注释' }],
    },
    {
      name: '前置块注释与后方代码同行（无前驱 token）：报错但不自动修复',
      code: '/* 前置块注释 */ const x = 1;',
      // 仅与后继代码同行、无前驱 token，fix 分支返回 null，故不产生修复
      output: null,
      errors: [{ message: '通用注释必须写在目标代码上方独占一行' }],
    },
    {
      name: '文件末尾无后继代码的块注释按非导出处理（块转行）',
      code: 'const x = 1;\n/* 尾部块注释 */',
      output: 'const x = 1;\n// 尾部块注释',
      errors: [{ message: '非导出代码的注释必须使用 `//` 行注释格式' }],
    },
    {
      name: '尾随注释与代码之间无空格时也移到上方独占一行',
      code: 'const x = 1;// 尾随注释',
      output: '// 尾随注释\nconst x = 1;',
      errors: [{ message: '通用注释必须写在目标代码上方独占一行' }],
    },
    {
      name: '导出上方注释组遇到可跳过注释时中断收集，单条 // 转 /** */',
      code: '// 第一段\n// eslint-disable-next-line no-console\nexport const foo = 1;',
      output: '/** 第一段 */\n// eslint-disable-next-line no-console\nexport const foo = 1;',
      errors: [{ message: '导出声明的注释必须使用 `/** */` 文档注释格式' }],
    },
    {
      name: '导出上方注释组遇到非相邻行时中断收集，各自单独转 /** */',
      code: '// 第一段\n\n// 第二段\nexport const foo = 1;',
      output: '/** 第一段 */\n\n/** 第二段 */\nexport const foo = 1;',
      errors: [
        { message: '导出声明的注释必须使用 `/** */` 文档注释格式' },
        { message: '导出声明的注释必须使用 `/** */` 文档注释格式' },
      ],
    },
    {
      name: '导出上方块注释与行注释混合堆叠应合并为一个 /** */',
      code: '/* 第一段 */\n// 第二段\nexport const foo = 1;',
      output: '/**\n * 第一段\n * 第二段\n */\nexport const foo = 1;',
      errors: [{ message: '导出上方的多段注释应合并为一个 `/** */` 文档注释' }],
    },
  ],
});
