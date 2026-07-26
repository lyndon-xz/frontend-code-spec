import tsparser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/structure/file-element-order.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsparser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('file-element-order', rule, {
  valid: [
    // 完整正确顺序：type → constant → helper → export
    {
      code: 'type Foo = number;\nconst MAX = 1;\nfunction helper() {}\nexport default helper;',
      filename: 'src/utils/foo.ts',
    },
    // interface(type) → 常量 → 主导出，顺序正确
    {
      code: 'interface Foo { a: number }\nconst MAX = 1;\nexport default 1;',
      filename: 'src/utils/foo.ts',
    },
    // 语句数不足 3（低于检查阈值），即使顺序颠倒也放行
    {
      code: 'const MAX = 1;\ninterface Foo { a: number }',
      filename: 'src/utils/foo.ts',
    },
    // 无法归类的语句（ExpressionStatement）被过滤，不参与顺序判定
    {
      code: 'interface Foo { a: number }\nconsole.log("x");\nconst MAX = 1;\nexport default 1;',
      filename: 'src/utils/foo.ts',
    },
    // enum 归为 constant，位于 type 之后合规
    {
      code: 'type Foo = number;\nenum E { A, B }\nexport default 1;',
      filename: 'src/utils/foo.ts',
    },
    // 豁免文件（测试文件）即使顺序错误也放行
    {
      code: 'const MAX = 1;\ninterface Foo { a: number }\nexport default 1;',
      filename: 'src/utils/foo.test.ts',
    },
    // export type 别名归为 type，interface 归为 type，顺序正确
    {
      code: 'export type T = number;\ninterface I { a: number }\nexport default 1;',
      filename: 'src/utils/foo.ts',
    },
    // export interface 归为 type，export const 大写常量归为 constant
    {
      code: 'export interface Foo { a: number }\nexport const MAX = 1;\nexport default 1;',
      filename: 'src/utils/foo.ts',
    },
    // export enum 归为 constant，const 箭头函数归为 helper
    {
      code: 'export enum E { A = 1 }\nconst helper = () => {};\nexport default 1;',
      filename: 'src/utils/foo.ts',
    },
    // let 变量（非 const）归为 helper，function 声明归为 helper
    {
      code: 'let x = 1;\nfunction help() {}\nexport default 1;',
      filename: 'src/utils/foo.ts',
    },
    // const 非大写非函数归为 constant（fallback 分支）
    {
      code: 'const foo = 1;\nconst bar = 2;\nexport default 1;',
      filename: 'src/utils/foo.ts',
    },
    // export { x } 无 declaration 归为 export（!decl 分支）
    {
      code: 'const z = 2;\nfunction h() {}\nexport { z };',
      filename: 'src/utils/foo.ts',
    },
    // export function 的 declaration 非 type/const/enum，归为 export
    {
      code: 'const a = 1;\nconst b = 2;\nexport function f() {}',
      filename: 'src/utils/foo.ts',
    },
    // export const 小写非函数归为 export（fallback）
    {
      code: 'const bar = 2;\nfunction h() {}\nexport const foo = 1;',
      filename: 'src/utils/foo.ts',
    },
  ],
  invalid: [
    {
      // 常量出现在类型之前
      code: 'const MAX = 1;\ninterface Foo { a: number }\nexport default 1;',
      filename: 'src/utils/foo.ts',
      errors: [{ messageId: 'wrongOrder' }],
    },
    {
      // 辅助函数出现在常量之前
      code: 'function h() {}\nconst MAX = 1;\nexport default 1;',
      filename: 'src/utils/foo.ts',
      errors: [{ messageId: 'wrongOrder' }],
    },
    {
      // 主导出出现在辅助函数之前
      code: 'export default 1;\nfunction h() {}\nconst x = 2;',
      filename: 'src/utils/foo.ts',
      errors: [{ messageId: 'wrongOrder' }],
    },
  ],
});
