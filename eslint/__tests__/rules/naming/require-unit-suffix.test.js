import rule from '../../../rules/naming/require-unit-suffix.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('require-unit-suffix', rule, {
  valid: [
    'interface Flight { priceCents: number; }',
    'interface Flight { priceYuan: number; }',
    // price 不在金额词根内：它自身已说清是什么，强制后缀会铺满领域模型
    'interface Flight { price: number; }',
    'interface Order { totalPrice: number; }',
    'interface Config { timeoutMs: number; }',
    'interface Flight { departureTimeMs: number; arrivalTimeIso: string; }',
    // createdAt / updatedAt 是社区共识的时间戳命名，不在时间点词根里
    'interface Record { createdAt: number; updatedAt: number; }',
    'interface Media { widthPx: number; }',
    'interface Upload { sizeBytes: number; }',
    'interface Order { totalAmountCents: number; unitPriceCents: number; }',
    // 非数值类型不受约束：单位歧义只在数值上成立
    'interface Flight { price: string; }',
    'interface Flight { size: "large" | "small"; }',
    'interface Flight { priceLabel: string; }',
    'interface Flight { flightNo: string; seatsLeft: number; total: number; }',
    // 函数类型成员即使名字命中词根也不是数值量纲
    'interface Calc { price: () => number; }',
    'interface Dict { [key: string]: number; }',
    // 计算键取自变量，静态期拿不到真实字段名，不做猜测
    'const KEY = "price"; interface Dict { [KEY]: number }',
    // 无类型注解的成员（隐式 any）不视为数值量纲
    'interface Loose { price }',
    // 局部变量与参数不校验：生命周期短、上下文就在眼前
    'const price = 100;',
    'function pay(price: number) { return price; }',
    // 未登记的后缀识别不出来，属「有意漏报换低噪音」的取舍，要覆盖就补 dimensions
    'interface Legacy { priceFen: number; }',
    {
      code: 'interface Legacy { price: number; }',
      options: [{ ignoredFields: ['price'] }],
    },
    // dimensions 整体替换默认量纲定义
    {
      code: 'interface Weird { price: number; }',
      options: [{ dimensions: [{ name: '重量', roots: ['weight'], suffixes: ['Kg'] }] }],
    },
  ],
  invalid: [
    {
      // 最典型的事故源：接口给「分」、展示按「元」
      code: 'interface Wallet { balance: number; }',
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
      code: 'interface Fare { fee: number | null; }',
      errors: [{ messageId: 'missingUnit' }],
    },
    {
      code: 'interface Anim { duration: number; height: number; }',
      errors: [{ messageId: 'missingUnit' }, { messageId: 'missingUnit' }],
    },
    {
      // 秒级/毫秒级时间戳混用是接口联调的常客
      code: 'interface Flight { departureTime: number; }',
      errors: [{ messageId: 'missingUnit' }],
    },
    {
      // timestamp 自身就是词根，不必与 time 复合也要带单位
      code: 'interface Envelope { timestamp: number; }',
      errors: [{ messageId: 'missingUnit' }],
    },
    {
      code: 'type Fee = { fee: number };',
      errors: [{ messageId: 'missingUnit' }],
    },
    {
      code: 'interface Order { deposit: number; balance: number; }',
      errors: [{ messageId: 'missingUnit' }, { messageId: 'missingUnit' }],
    },
    {
      code: 'interface Cargo { weight: number; }',
      options: [{ dimensions: [{ name: '重量', roots: ['weight'], suffixes: ['Kg'] }] }],
      errors: [{ messageId: 'missingUnit' }],
    },
  ],
});
