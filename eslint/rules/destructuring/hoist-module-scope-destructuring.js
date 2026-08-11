/*
 * actions 对象、映射表这类模块级常量不随渲染变化。解构写进组件体，它会和 useXxxModel() 那行并列，
 * 暗示它也随渲染变化；提到 import 之后、组件之前，组件体就只剩渲染真正依赖的东西。
 *
 * 判据是「右侧标识符解析到模块作用域」，而不是「在组件里」：props（参数）、useXxxModel()（调用）、
 * obj.nested（成员访问）都不报，只报 const { a } = importedActions。
 * 只看 ObjectPattern：数组解构取的是位置而非成员，提到顶层没有意义。
 */

// 模块顶层的解构本身就是目标形态，不必再查
function isInModuleScope(scope) {
  return scope.type === 'module' || scope.type === 'global';
}

function isModuleLevelBinding(scope, name) {
  let current = scope;

  while (current) {
    const found = current.set.get(name);

    if (found) {
      // 无定义节点的绑定来自环境（globals），不是本模块的常量
      return isInModuleScope(current) && found.defs.length > 0;
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
    },
    fixable: null,
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
