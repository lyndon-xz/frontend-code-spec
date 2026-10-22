import { createPrefixRule } from '../../utils/create-prefix-rule.js';
import { ruleDocsUrl } from '../../utils/rule-docs-url.js';

/** 全程按「函数值」过滤，避免误伤名词属性（handleId 指句柄，并非事件处理器） */
export default createPrefixRule({
  prefix: 'handle',
  checkObjectProperties: true,
  functionMessageId: 'noHandleFn',
  variableMessageId: 'noHandleVar',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        '禁止函数/变量使用 handle 前缀，必须使用语义化动词（如 saveData 而非 handleClick）',
      url: ruleDocsUrl('no-handle-prefix'),
    },
    schema: [],
    messages: {
      noHandleFn:
        'handle 只说明「这里有个处理器」，一屏多个 handleXxx 无法区分：请改用说明动作的动词（如 saveData 而非 handleClick）',
      noHandleVar:
        '函数型变量也不用 handle 前缀，它不说明做了什么：请改用说明动作的动词（如 saveDraft 而非 handleSave）',
    },
  },
});
