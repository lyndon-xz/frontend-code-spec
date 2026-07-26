import tsparser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/comments/comment-style.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsparser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('comment-style', rule, {
  valid: [
    // 非导出单行注释使用 //
    '// 普通注释\nconst a = 1;',
    // 导出上方使用 /** */ 文档注释
    '/** 文档注释 */\nexport const a = 1;',
    // 非导出多行使用普通 /* */ 块注释（非 JSDoc）
    'function f() {}\n/* 第一行\n 第二行 */\nconst a = 1;',
    // 内联参数块注释放行：左右都有同行 token
    "foo(/* name */ 'bar');",
    // eslint 指令注释放行
    '// eslint-disable-next-line no-unused-vars\nconst a = 1;',
    // @ts- 指令注释放行
    '// @ts-ignore\nconst a = 1;',
    // 三斜线引用指令放行
    '/// <reference types="node" />\nconst a = 1;',
    // 被注释掉的代码放行（行首像语句关键字）
    '// const x = 1;\nconst a = 2;',
    // 被注释掉的代码放行（行首像函数调用）
    '// foo();\nconst a = 2;',
    // 被注释掉的代码放行（行首像赋值语句）
    '// x = 1\nconst a = 2;',
    // 被注释掉的代码放行（以大括号结尾）
    '// }\nconst a = 2;',
    // 含 JSDoc 标签的块注释视为约定文档，放行
    '/**\n * @deprecated\n */\nexport const a = 1;',
  ],
  invalid: [
    // 注释未独占一行（写在代码右侧），移动到上方
    {
      code: 'const a = 1; // 说明',
      errors: [{ messageId: 'notAbove' }],
      output: '// 说明\nconst a = 1;',
    },
    // 注释在行首但右侧紧跟代码、其前无 token：报 notAbove 且不自动修复
    {
      code: '/* 说明 */ const a = 1;',
      errors: [{ messageId: 'notAbove' }],
      output: null,
    },
    // 非导出的单行块注释应改为 //
    {
      code: '/* 说明 */\nconst a = 1;',
      errors: [{ messageId: 'internalSingleLine' }],
      output: '// 说明\nconst a = 1;',
    },
    // 非导出的多行 JSDoc 应降级为普通 /* */
    {
      code: '/**\n * 说明\n */\nconst a = 1;',
      errors: [{ messageId: 'internalMultiLine' }],
      output: '/*\n * 说明\n */\nconst a = 1;',
    },
    // 导出上方的单行 // 应改为 /** */
    {
      code: '// 说明\nexport const a = 1;',
      errors: [{ messageId: 'exportNeedsJsdoc' }],
      output: '/** 说明 */\nexport const a = 1;',
    },
    // 导出上方的普通块注释应改为 /** */
    {
      code: '/* 说明 */\nexport const a = 1;',
      errors: [{ messageId: 'exportNeedsJsdoc' }],
      output: '/** 说明 */\nexport const a = 1;',
    },
    // 导出上方多段堆叠注释合并为单个 /** */
    {
      code: '// 第一行\n// 第二行\nexport const a = 1;',
      errors: [{ messageId: 'exportMergeJsdoc' }],
      output: '/**\n * 第一行\n * 第二行\n */\nexport const a = 1;',
    },
  ],
});
