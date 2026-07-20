export default {
  meta: { type: 'problem' },
  create(context) {
    return {
      'TSEnumMember:not([initializer])'(node) {
        context.report({ node, message: '禁止自动递增枚举，每个枚举成员必须显式赋值（字符串或数字）' });
      },
    };
  },
};
