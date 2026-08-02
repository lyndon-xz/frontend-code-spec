import { createPrefixRule } from '../../utils/create-prefix-rule.js';

/**
 * 覆盖顶层函数声明与函数型变量、类方法、类箭头字段、对象方法 / 箭头属性。
 * 全程按「函数值」过滤（与 no-internal-on-prefix 共用 createPrefixRule），
 * 避免误伤名词属性（如 handleId 指句柄/账号，并非事件处理器）。
 */
export default createPrefixRule({
  prefix: 'handle',
  // 对象字面量里的 handleXxx 函数属性同样是事件处理器命名，需校验
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
