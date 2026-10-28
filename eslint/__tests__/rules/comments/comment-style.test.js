import rule from '../../../rules/comments/comment-style.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('comment-style', rule, {
  valid: [
    '/** 创建用户 */\nexport const x = 1;',
    '// 普通说明\nconst a = 1;',
    // 空行隔断的两段不视为堆叠
    '// 第一段\n\n// 第二段\nconst a = 1;',
    /*
     * 与 export 之间空了一行的块注释是模块级说明、不是那个 export 的文档注释，
     * 按非导出位置判形态。要求它改成 JSDoc 会让语义错位。
     */
    '/*\n * 模块在做什么\n */\n\n/** 文档注释 */\nexport const x = 1;',
    // 单行的模块级说明同理：空行断开后按非导出位置判，// 就是对的
    '// 模块在做什么\n\nexport const x = 1;',
    // 堆叠中夹工具指令时停止合并，并进块注释会改变它对 ESLint 的语义
    '// 第一段\n// eslint-disable-next-line no-console\nconsole.log(1);',
    // 末尾注释后没有代码，按非导出位置处理
    'const a = 1;\n// 收尾说明\n',
    '/*\n * 多行说明\n * 第二行\n */\nconst a = 1;',
    // 数组元素上方的多行说明不是导出文档注释，用普通块注释
    'export default [\n  /*\n   * 数组元素的说明\n   */\n  value,\n];',
    // 注释在 export 关键字上方，仍算导出文档注释
    '/** 导出数组 */\nexport default [\n  value,\n];',
    // 内联参数块注释放行
    "foo(/* name */ 'bar');",
    '// eslint-disable-next-line no-console\nconsole.log(1);',
    '// @ts-expect-error 忽略\nconst a = 1;',
    '/// <reference types="node" />\nconst a = 1;',
    // 含 @ 标签的 JSDoc 即使不在导出上方也放行
    '/** @deprecated 用新接口 */\nconst a = 1;',
    // 被注释掉的代码按行首像语句识别，放行
    '// const removed = 1;\nconst a = 1;',
    '// doSomething();\nconst a = 1;',
    '// x.y = 2;\nconst a = 1;',
    '// foo bar;\nconst a = 1;',
  ],
  invalid: [
    {
      code: '// 创建用户\nexport const x = 1;',
      output: '/** 创建用户 */\nexport const x = 1;',
      errors: [{ messageId: 'exportNeedsJsdoc' }],
    },
    {
      code: '/* 创建用户 */\nexport const x = 1;',
      output: '/** 创建用户 */\nexport const x = 1;',
      errors: [{ messageId: 'exportNeedsJsdoc' }],
    },
    {
      code: '// 第一行\n// 第二行\nexport const x = 1;',
      output: '/**\n * 第一行\n * 第二行\n */\nexport const x = 1;',
      errors: [{ messageId: 'exportMergeJsdoc' }],
    },
    {
      // 覆盖 flattenBlockCommentText 分支
      code: '/* 甲 */\n/* 乙 */\nexport const x = 1;',
      output: '/**\n * 甲\n * 乙\n */\nexport const x = 1;',
      errors: [{ messageId: 'exportMergeJsdoc' }],
    },
    {
      code: '/* 普通说明 */\nconst a = 1;',
      output: '// 普通说明\nconst a = 1;',
      errors: [{ messageId: 'internalSingleLine' }],
    },
    {
      code: '/**\n * 说明\n */\nconst a = 1;',
      output: '/*\n * 说明\n */\nconst a = 1;',
      errors: [{ messageId: 'internalMultiLine' }],
    },
    {
      // 数组元素上方不属于导出声明，JSDoc 要改成普通块注释
      code: 'export default [\n  /**\n   * 数组元素的说明\n   */\n  value,\n];',
      output: 'export default [\n  /*\n   * 数组元素的说明\n   */\n  value,\n];',
      errors: [{ messageId: 'internalMultiLine' }],
    },
    {
      code: '// 第一行\n// 第二行\nconst a = 1;',
      output: '/*\n * 第一行\n * 第二行\n */\nconst a = 1;',
      errors: [{ messageId: 'internalMergeBlock' }],
    },
    {
      // 覆盖 flattenBlockCommentText 分支
      code: '/* 甲 */\n/* 乙 */\nconst a = 1;',
      output: '/*\n * 甲\n * 乙\n */\nconst a = 1;',
      errors: [{ messageId: 'internalMergeBlock' }],
    },
    {
      // 内容含块注释结束符，包进 /** */ 会提前闭合产生语法错误，故不 fix
      code: '// 见 /* x */ 的说明\nexport const x = 1;',
      output: null,
      errors: [{ messageId: 'exportNeedsJsdoc' }],
    },
    {
      code: '// 第一行\n// 见 /* x */\nexport const x = 1;',
      output: null,
      errors: [{ messageId: 'exportMergeJsdoc' }],
    },
    {
      code: '// 第一行\n// 见 /* x */\nconst a = 1;',
      output: null,
      errors: [{ messageId: 'internalMergeBlock' }],
    },
    {
      code: 'const a = 1; // 说明',
      output: '// 说明\nconst a = 1;',
      errors: [{ messageId: 'notAbove' }],
    },
    {
      // 紧贴代码无空格的行尾注释，移动时无空格可清理
      code: 'const a = 1;// 说明',
      output: '// 说明\nconst a = 1;',
      errors: [{ messageId: 'notAbove' }],
    },
    {
      // 后继 token 不同，行相邻也不算堆叠
      code: '// 归属 x\nconst x = 1; // 行尾\nconst y = 2;',
      output: '// 归属 x\n// 行尾\nconst x = 1;\nconst y = 2;',
      errors: [{ messageId: 'notAbove' }],
    },
    {
      code: '/* 说明 */ const a = 1;',
      output: null,
      errors: [{ messageId: 'notAbove' }],
    },
  ],
});
