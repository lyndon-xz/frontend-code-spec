import { createPrefixRule } from '../../utils/create-prefix-rule.js';

/** 全程按「函数值」过滤，避免误伤名词属性（handleId 指句柄 / 账号，并非事件处理器） */
export default createPrefixRule({
  prefix: 'handle',
  // 对象字面量里的 handleXxx 函数属性同样是事件处理器命名
  checkObjectProperties: true,
  functionMessageId: 'noHandleFn',
  variableMessageId: 'noHandleVar',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        '禁止函数/变量使用 handle 前缀，必须使用语义化动词（如 saveData 而非 handleClick）',
    },
    schema: [],
    messages: {
      noHandleFn: '函数禁止 handle 前缀，必须使用语义化动词（如 saveData 而非 handleClick）',
      noHandleVar: '变量/函数禁止 handle 前缀，必须使用语义化动词',
    },
  },
});
