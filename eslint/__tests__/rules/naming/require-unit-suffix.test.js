import rule from '../../../rules/naming/require-unit-suffix.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('require-unit-suffix', rule, {
  valid: [
    // 带单位后缀的量纲字段
    'interface Flight { priceCents: number; }',
    'interface Flight { priceYuan: number; }',
    'interface Config { timeoutMs: number; }',
    'interface Media { widthPx: number; }',
    'interface Upload { sizeBytes: number; }',
    // 词根出现在中间/开头，后缀齐全
    'interface Order { totalAmountCents: number; unitPriceCents: number; }',
    // 非数值类型不受约束：单位歧义只在数值上成立
    'interface Flight { price: string; }',
    'interface Flight { size: "large" | "small"; }',
    'interface Flight { priceLabel: string; }',
    // 非量纲字段
    'interface Flight { flightNo: string; seatsLeft: number; total: number; }',
    // 函数类型成员即使名字命中词根也不是数值量纲
    'interface Calc { price: () => number; }',
    // 计算属性名无法静态判定，不做猜测
    'interface Dict { [key: string]: number; }',
    // 局部变量与参数不校验：生命周期短、上下文就在眼前
    'const price = 100;',
    'function pay(price: number) { return price; }',
    // 未登记的单位后缀识别不出来，是「有意漏报换低噪音」的取舍，需要覆盖就补 dimensions
    'interface Legacy { priceFen: number; }',
    // 可通过 ignoredFields 放行既有契约字段
    {
      code: 'interface Legacy { price: number; }',
      options: [{ ignoredFields: ['price'] }],
    },
    // 可通过 dimensions 完全替换量纲定义
    {
      code: 'interface Weird { price: number; }',
      options: [{ dimensions: [{ name: '重量', roots: ['weight'], suffixes: ['Kg'] }] }],
    },
  ],
  invalid: [
    {
      // 最典型的事故源：接口给「分」、展示按「元」
      code: 'interface Flight { price: number; }',
      errors: [{ messageId: 'missingUnit' }],
    },
    {
      // 词根在末尾即命中，覆盖 totalAmount / unitPrice 这类复合命名
      code: 'interface Order { totalAmount: number; }',
      errors: [{ messageId: 'missingUnit' }],
    },
    {
      // 可选字段同样是契约的一部分
      code: 'interface Config { timeout?: number; }',
      errors: [{ messageId: 'missingUnit' }],
    },
    {
      // 联合类型里含 number 就算数值量纲
      code: 'interface Fare { price: number | null; }',
      errors: [{ messageId: 'missingUnit' }],
    },
    {
      // 时长与尺寸两个量纲各报一次
      code: 'interface Anim { duration: number; height: number; }',
      errors: [{ messageId: 'missingUnit' }, { messageId: 'missingUnit' }],
    },
    {
      // type 字面量的成员同样是类型成员
      code: 'type Fee = { fee: number };',
      errors: [{ messageId: 'missingUnit' }],
    },
    {
      // 金额量纲的其余词根同样覆盖
      code: 'interface Order { deposit: number; balance: number; }',
      errors: [{ messageId: 'missingUnit' }, { messageId: 'missingUnit' }],
    },
    {
      // 自定义量纲同样生效
      code: 'interface Cargo { weight: number; }',
      options: [{ dimensions: [{ name: '重量', roots: ['weight'], suffixes: ['Kg'] }] }],
      errors: [{ messageId: 'missingUnit' }],
    },
  ],
});
