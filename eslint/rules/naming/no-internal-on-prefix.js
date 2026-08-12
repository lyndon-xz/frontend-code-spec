import { createPrefixRule } from '../../utils/create-prefix-rule.js';

/** `on` 前缀仅用于 Props 回调声明，内部函数禁用；不覆盖对象属性，避免误报 { onClick } */
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
