import { createPrefixRule } from '../../utils/create-prefix-rule.js';
import { ruleDocsUrl } from '../../utils/rule-docs-url.js';

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
      url: ruleDocsUrl('no-internal-on-prefix'),
    },
    schema: [],
    messages: {
      noInternalOn:
        '`on` 前缀专指 Props 回调，内部函数用它会让读者以为是外部传入的：请改用说明动作的动词（如 saveData 而非 onSave）',
    },
  },
});
