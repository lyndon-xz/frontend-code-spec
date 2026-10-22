import { ruleDocsUrl } from '../../utils/rule-docs-url.js';

/*
 * 判据是「右侧标识符解析到模块作用域」而非「在组件里」：props、useXxxModel()、obj.nested 都不报。
 * 只看 ObjectPattern：数组解构取的是位置而非成员，提到顶层没有意义。
 */

function isInModuleScope(scope) {
  return scope.type === 'module' || scope.type === 'global';
}

/*
 * 只认 const：可重新赋值的模块级绑定（provider 注入槽这类 let）提到顶层会改变语义——
 * 函数体内读的是调用时的最新值，提到顶层读的是模块求值那一刻的初值。
 */
function isImmutableBinding(def) {
  // import 绑定不可重新赋值，与 const 同档
  if (def.type === 'ImportBinding') {
    return true;
  }
  return def.parent?.type === 'VariableDeclaration' && def.parent.kind === 'const';
}

function isModuleLevelBinding(scope, name) {
  let current = scope;

  while (current) {
    const found = current.set.get(name);

    if (found) {
      // 无定义节点的绑定来自环境（globals），不是本模块的常量
      return (
        isInModuleScope(current) && found.defs.length > 0 && found.defs.every(isImmutableBinding)
      );
    }
    current = current.upper;
  }
  return false;
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '模块级绑定的解构提到模块顶层，不写在函数体内',
      url: ruleDocsUrl('hoist-module-scope-destructuring'),
    },
    schema: [],
    messages: {
      hoistDestructuring:
        '`{{name}}` 是模块级绑定，把这行解构提到 import 之后、函数之前；写在函数体内会暗示它随调用变化',
    },
  },
  create(context) {
    return {
      VariableDeclarator(node) {
        if (node.id.type !== 'ObjectPattern' || node.init?.type !== 'Identifier') {
          return;
        }

        const scope = context.sourceCode.getScope(node);

        if (isInModuleScope(scope)) {
          return;
        }

        const { name } = node.init;

        if (isModuleLevelBinding(scope, name)) {
          context.report({ node, messageId: 'hoistDestructuring', data: { name } });
        }
      },
    };
  },
};
