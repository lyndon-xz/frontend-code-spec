import rule from '../../../rules/comments/comment-style.js';
import { createRuleTester } from '../../_support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('comment-style', rule, {
  valid: [
    // 导出上方使用 /** */ 文档注释
    '/** 创建用户 */\nexport const x = 1;',
    // 非导出单行 // 注释
    '// 普通说明\nconst a = 1;',
    // 非导出多行普通块注释（非 JSDoc）
    '/*\n * 多行说明\n * 第二行\n */\nconst a = 1;',
    // 内联参数块注释放行
    "foo(/* name */ 'bar');",
    // 工具指令注释放行
    '// eslint-disable-next-line no-console\nconsole.log(1);',
    // @ts- 指令放行
    '// @ts-expect-error 忽略\nconst a = 1;',
    // 三斜线引用放行
    '/// <reference types="node" />\nconst a = 1;',
    // 含 @ 标签的 JSDoc 放行
    '/** @deprecated 用新接口 */\nconst a = 1;',
    // 被注释掉的代码放行（行首像语句）
    '// const removed = 1;\nconst a = 1;',
    // 被注释掉的代码：标识符调用形态
    '// doSomething();\nconst a = 1;',
    // 被注释掉的代码：赋值形态
    '// x.y = 2;\nconst a = 1;',
    // 被注释掉的代码：以分号/花括号结尾
    '// foo bar;\nconst a = 1;',
  ],
  invalid: [
    {
      // 导出上方的 // 注释必须转为 /** */
      code: '// 创建用户\nexport const x = 1;',
      output: '/** 创建用户 */\nexport const x = 1;',
      errors: [{ messageId: 'exportNeedsJsdoc' }],
    },
    {
      // 导出上方的普通块注释转为 /** */
      code: '/* 创建用户 */\nexport const x = 1;',
      output: '/** 创建用户 */\nexport const x = 1;',
      errors: [{ messageId: 'exportNeedsJsdoc' }],
    },
    {
      // 导出上方多段注释合并为一个 /** */
      code: '// 第一行\n// 第二行\nexport const x = 1;',
      output: '/**\n * 第一行\n * 第二行\n */\nexport const x = 1;',
      errors: [{ messageId: 'exportMergeJsdoc' }],
    },
    {
      // 导出上方多段「块注释」合并（覆盖 stripBlock 分支）
      code: '/* 甲 */\n/* 乙 */\nexport const x = 1;',
      output: '/**\n * 甲\n * 乙\n */\nexport const x = 1;',
      errors: [{ messageId: 'exportMergeJsdoc' }],
    },
    {
      // 非导出的单行块注释降级为 //
      code: '/* 普通说明 */\nconst a = 1;',
      output: '// 普通说明\nconst a = 1;',
      errors: [{ messageId: 'internalSingleLine' }],
    },
    {
      // 非导出的多行 JSDoc 降级为普通块注释
      code: '/**\n * 说明\n */\nconst a = 1;',
      output: '/*\n * 说明\n */\nconst a = 1;',
      errors: [{ messageId: 'internalMultiLine' }],
    },
    {
      // 行尾注释必须移到上方独占一行（可自动修复）
      code: 'const a = 1; // 说明',
      output: '// 说明\nconst a = 1;',
      errors: [{ messageId: 'notAbove' }],
    },
    {
      // 代码前同行的块注释不合规且不自动修复
      code: '/* 说明 */ const a = 1;',
      output: null,
      errors: [{ messageId: 'notAbove' }],
    },
  ],
});
