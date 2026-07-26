/**
 * 禁止自动递增枚举，每个枚举成员必须显式赋值。
 */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: '禁止自动递增枚举，每个枚举成员必须显式赋值（字符串或数字）',
    },
    schema: [],
    messages: {
      requireInitializer: '禁止自动递增枚举，每个枚举成员必须显式赋值（字符串或数字）',
    },
  },
  create(context) {
    return {
      'TSEnumMember:not([initializer])'(node) {
        context.report({ node, messageId: 'requireInitializer' });
      },
    };
  },
};
