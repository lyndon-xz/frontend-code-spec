export default {
  meta: { type: 'problem' },
  create(context) {
    return {
      'CallExpression[callee.property.name=/^toMatch(Inline)?Snapshot$/]'(node) {
        context.report({ node, message: '禁止使用快照测试，请使用明确的断言' });
      },
      'Identifier[name="done"]'(node) {
        context.report({ node, message: '禁止使用 done 回调，请使用 async/await' });
      },
      'VariableDeclarator[init.callee.object.name="vi"][init.callee.property.name="fn"] > Identifier.id[name!=/^mock/]'(
        node,
      ) {
        context.report({ node, message: 'Mock 函数强制使用 mock 前缀（如 mockMessageError）' });
      },
    };
  },
};
