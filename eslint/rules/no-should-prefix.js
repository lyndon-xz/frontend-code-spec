export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'it() 描述禁止以 "should" 开头',
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        // 匹配 it('...') 和 it.each(...)('...')
        const callee = node.callee;
        let isIt = false;

        if (callee.type === 'Identifier' && callee.name === 'it') {
          isIt = true;
        } else if (
          callee.type === 'MemberExpression' &&
          callee.object.type === 'Identifier' &&
          callee.object.name === 'it'
        ) {
          // it.each, it.only, it.skip 等
          isIt = true;
        }

        if (!isIt) return;

        const firstArg = node.arguments[0];
        if (!firstArg || firstArg.type !== 'Literal' || typeof firstArg.value !== 'string') {
          return;
        }

        const description = firstArg.value;
        if (!description.startsWith('should ')) return;

        context.report({
          node: firstArg,
          message: 'it() 描述禁止以 "should" 开头（it 本身已表期望，直述可观测行为即可，如 "无缓存时返回 null"）',
          fix(fixer) {
            const raw = firstArg.raw;
            const quote = raw[0];
            const inner = raw.slice(1, -1);
            const stripped = inner.replace(/^should\s+/, '');
            return fixer.replaceText(firstArg, `${quote}${stripped}${quote}`);
          },
        });
      },
    };
  },
};
