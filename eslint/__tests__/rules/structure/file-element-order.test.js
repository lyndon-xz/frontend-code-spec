import rule from '../../../rules/structure/file-element-order.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('file-element-order', rule, {
  valid: [
    {
      // 正确顺序：type → constant → helper → export
      code: 'interface A { x: number }\nconst MAX = 1;\nconst run = () => {};\nexport default run;',
      filename: 'src/apis/foo.ts',
    },
    {
      /*
       * 覆盖 categorize 各分支，按正确顺序排列：
       * import（跳过）→ 各类 type（interface / type / 具名导出 interface）
       * → 各类 constant（全大写常量 / enum / 具名导出 enum / 具名导出常量 / const 对象）
       * → 表达式语句（无法归类，返回 null）
       * → 各类 helper（const 箭头 / 函数声明 / let 声明）
       * → 各类 export（具名导出无 declaration / 默认导出）
       */
      code: [
        'import dep from "./dep";',
        'interface A { a: number }',
        'type B = string;',
        'export interface C { c: number }',
        'const MAX = 1;',
        'enum E { A = 1 }',
        'export enum F { A = 1 }',
        'export const MIN = 0;',
        'const config = { a: 1 };',
        'doSideEffect();',
        'const run = () => {};',
        'function helper2() {}',
        'class Helper3 {}',
        'let mutable = 1;',
        'export { MAX };',
        'export default run;',
      ].join('\n'),
      filename: 'src/apis/full.ts',
    },
    {
      // 豁免文件跳过
      code: 'const MAX = 1;\ninterface A { x: number }\nexport default MAX;',
      filename: 'foo.test.ts',
    },
    {
      // 少于 3 条语句不校验
      code: 'const MAX = 1;\ninterface A { x: number }',
      filename: 'src/apis/foo.ts',
    },
  ],
  invalid: [
    {
      // 未导出的 class 与函数声明同为 helper：出现在 constant 之前即违规
      code: 'class Service {}\nconst MAX = 1;\nexport default Service;',
      filename: 'src/apis/foo.ts',
      errors: [{ messageId: 'wrongOrder' }],
    },
    {
      // 同一个 class 加上 export 后归为主导出，出现在 helper 之前同样违规——加不加 export 都受约束
      code: 'export class Service {}\nconst run = () => {};\nconst MAX = 1;',
      filename: 'src/apis/bar.ts',
      errors: [{ messageId: 'wrongOrder' }, { messageId: 'wrongOrder' }],
    },
    {
      // constant 出现在 type 之前
      code: 'const MAX = 1;\ninterface A { x: number }\nexport default MAX;',
      filename: 'src/apis/foo.ts',
      errors: [{ messageId: 'wrongOrder' }],
    },
    {
      // helper 出现在 constant 之前
      code: 'const run = () => {};\nconst MAX = 1;\nexport default run;',
      filename: 'src/apis/foo.ts',
      errors: [{ messageId: 'wrongOrder' }],
    },
    {
      // 多处顺序颠倒时一次报全，不在首个违规处中断
      code: [
        'const run = () => {};',
        'const MAX = 1;',
        'interface A { x: number }',
        'export default run;',
      ].join('\n'),
      filename: 'src/apis/multi.ts',
      errors: [{ messageId: 'wrongOrder' }, { messageId: 'wrongOrder' }],
    },
  ],
});
