import tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/file-element-order.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

const SRC_FILE = 'src/feature/demo.ts';

ruleTester.run('file-element-order', rule, {
  valid: [
    {
      name: '顺序正确：type → constant → helper → export',
      filename: SRC_FILE,
      code: [
        'type Foo = { a: number };',
        'const MAX = 10;',
        'function helper() { return 1; }',
        'export const bar = 2;',
      ].join('\n'),
    },
    {
      name: 'import 语句位于顶部且其余元素有序时放行',
      filename: SRC_FILE,
      code: [
        "import { dep } from 'lib';",
        'type Foo = { a: number };',
        'const MAX = 10;',
        'export const bar = 2;',
      ].join('\n'),
    },
    {
      name: '语句数量少于阈值时不校验',
      filename: SRC_FILE,
      code: 'export const bar = 2;\ntype Foo = { a: number };',
    },
    {
      name: '豁免文件（测试文件）不校验',
      filename: 'src/feature/demo.test.ts',
      code: ['export const bar = 2;', 'const MAX = 10;', 'function helper() { return 1; }'].join('\n'),
    },
    {
      name: '混合非导出元素按 type→constant→helper 顺序排列时放行',
      filename: SRC_FILE,
      code: [
        'type Foo = { a: number };',
        'const MAX = 10;',
        'enum Color { Red = 1 }',
        'const helper = () => 1;',
        'function other() { return 1; }',
        'let counter = 0;',
        'export const bar = 3;',
      ].join('\n'),
    },
    {
      name: '各类导出声明顺序正确时放行',
      filename: SRC_FILE,
      code: [
        'export interface Api { x: number }',
        'export type Id = string;',
        'export const MAX_LEN = 5;',
        'export enum Status { Active = 1 }',
        'export const run = () => 1;',
      ].join('\n'),
    },
    {
      name: '无声明的具名导出（export { x }）归类为 export',
      filename: SRC_FILE,
      code: ['type Foo = { a: number };', 'function helper() { return 1; }', 'export { helper };'].join('\n'),
    },
    {
      name: '普通小写 const 值归为 constant、函数表达式 const 归为 helper',
      filename: SRC_FILE,
      code: [
        'type Foo = { a: number };',
        'const plain = globalThis;',
        'const fn = function () { return 1; };',
        'export const bar = 2;',
      ].join('\n'),
    },
    {
      name: '表达式语句与 export default 混排时放行',
      filename: SRC_FILE,
      code: ['type Foo = { a: number };', 'doSomething();', 'export default Foo;'].join('\n'),
    },
  ],
  invalid: [
    {
      name: '常量出现在导出之后应报错',
      filename: SRC_FILE,
      code: ['export const bar = 2;', 'const MAX = 10;', 'function helper() { return 1; }'].join('\n'),
      errors: [
        {
          message:
            '代码元素顺序错误：`constant` 不应出现在 `export` 之后（正确顺序：type → constant → helper → export）',
        },
      ],
    },
    {
      name: '类型出现在辅助函数之后应报错',
      filename: SRC_FILE,
      code: ['const MAX = 10;', 'function helper() { return 1; }', 'type Foo = { a: number };'].join('\n'),
      errors: [
        {
          message: '代码元素顺序错误：`type` 不应出现在 `helper` 之后（正确顺序：type → constant → helper → export）',
        },
      ],
    },
    {
      name: '带前导注释的乱序：只报错、不自动修复（不改写代码，注释零丢失）',
      filename: SRC_FILE,
      code: [
        '/** 主导出 */',
        'export const bar = 2;',
        '// 上限常量',
        'const MAX = 10;',
        '/** 辅助函数 */',
        'function helper() { return 1; }',
      ].join('\n'),
      // 无 output 字段：report-only 规则不产生任何自动修复，注释与结构保持原样
      errors: [
        {
          message:
            '代码元素顺序错误：`constant` 不应出现在 `export` 之后（正确顺序：type → constant → helper → export）',
        },
      ],
    },
  ],
});
