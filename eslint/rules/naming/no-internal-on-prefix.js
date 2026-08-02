import { createPrefixRule } from '../../utils/create-prefix-rule.js';

/**
 * 覆盖内部函数的四种形态：函数声明、函数型变量、类方法、类箭头字段。
 * 刻意不覆盖对象属性与接口/类型成员：那里常是回调 Props 的合法声明处（如 { onClick }、interface Props { onClick }），覆盖会误报。
 */
export default createPrefixRule({
  prefix: 'on',
  checkObjectProperties: false,
  functionMessageId: 'noInternalOn',
  variableMessageId: 'noInternalOn',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        '`on` 前缀仅用于 Props 回调声明，内部函数请使用语义化动词（如 saveData 而非 onSave）',
    },
    schema: [],
    messages: {
      noInternalOn:
        '`on` 前缀仅用于 Props 回调声明，内部函数请使用语义化动词（如 saveData 而非 onSave）',
    },
  },
});
