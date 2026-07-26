/**
 * 禁止 .then()/.catch() 链式调用，统一使用 async/await。
 */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: '禁止 .then()/.catch() 链式调用，统一使用 async/await',
    },
    schema: [],
    messages: {
      noThenChain: '禁止使用 .then() 链式调用，请统一使用 async/await',
      noCatchChain: '禁止使用 .catch() 链式调用，请统一使用 async/await',
    },
  },
  create(context) {
    // 被禁止的 Promise 链式方法名 -> 对应报错文案 id
    const chainMethodToMessageId = {
      then: 'noThenChain',
      catch: 'noCatchChain',
    };

    /**
     * 解析成员调用的方法名，仅识别 then / catch（含计算成员 obj['then']）
     * @param {import('estree').Expression | import('estree').Super} property
     * @param {boolean} computed
     * @returns {'then' | 'catch' | null}
     */
    function resolveChainMethod(property, computed) {
      const name = computed
        ? property.type === 'Literal' && property.value
        : property.type === 'Identifier' && property.name;

      // 用 Object.hasOwn 而非 in，避免误命中 toString/valueOf 等原型链上的方法名
      return Object.hasOwn(chainMethodToMessageId, name) ? name : null;
    }

    return {
      CallExpression(node) {
        if (node.callee.type !== 'MemberExpression') {
          return;
        }

        const method = resolveChainMethod(node.callee.property, node.callee.computed);
        if (method) {
          context.report({ node: node.callee.property, messageId: chainMethodToMessageId[method] });
        }
      },
    };
  },
};
