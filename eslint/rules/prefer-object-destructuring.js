const MAX_DISPLAY_PROPS = 3;

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        '当同一对象在同一作用域内被访问的不同属性数超过阈值（maxAccessCount，默认 2，即出现第 3 个不同属性）时，强制改用解构赋值',
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          maxAccessCount: {
            type: 'number',
            default: 2,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] || {};
    const maxAccessCount = options.maxAccessCount ?? 2;

    // 记录每个作用域下的对象访问情况
    const scopeTracker = new Map();

    // 忽略 this, window, console, process, process.env 等全局/特殊对象
    const IGNORED_OBJECTS = [
      'this',
      'window',
      'console',
      'process',
      'global',
      'globalThis',
      'document',
      'Math',
      'JSON',
      'Object',
      'Array',
      'String',
      'Number',
      'Date',
      'styles',
    ];

    return {
      MemberExpression(node) {
        // 只处理 identifier.property 形式，如 user.name，忽略 user[key] 或 foo.bar.baz (只统计算 foo.bar )
        if (node.object.type === 'Identifier' && node.property.type === 'Identifier' && !node.computed) {
          const objectName = node.object.name;
          const propertyName = node.property.name;

          // 忽略特例
          if (IGNORED_OBJECTS.includes(objectName)) return;
          // 忽略大写开头的类/枚举访问 (例如：UserStatus.ACTIVE)
          if (/^[A-Z]/.test(objectName)) return;

          // 忽略方法调用 (例如 redirectLink.click()、arr.map()）
          if (node.parent.type === 'CallExpression' && node.parent.callee === node) {
            return;
          }

          // 如果是在赋值的左侧，不计算在内 (例如 user.name = 'xxx')
          let parent = node.parent;
          if (parent.type === 'AssignmentExpression' && parent.left === node) {
            return;
          }
          // 如果是在 delete 操作符中，不计算在内
          if (parent.type === 'UnaryExpression' && parent.operator === 'delete') {
            return;
          }

          const scope = context.sourceCode.getScope(node);
          const scopeNode = scope.block;

          if (!scopeTracker.has(scopeNode)) {
            scopeTracker.set(scopeNode, new Map());
          }

          const objectMap = scopeTracker.get(scopeNode);
          if (!objectMap.has(objectName)) {
            objectMap.set(objectName, new Set());
          }

          // 记录访问过的属性
          objectMap.get(objectName).add(propertyName);
        }
      },

      'Program:exit'() {
        for (const [scopeNode, objectMap] of scopeTracker.entries()) {
          for (const [objectName, properties] of objectMap.entries()) {
            if (properties.size > maxAccessCount) {
              // 无法在此钩子精确定位原始节点，故把报错挂在作用域/文件顶层，提示开发者该解构了
              const propsArray = Array.from(properties);
              // 取前几个展示
              const displayProps =
                propsArray.slice(0, MAX_DISPLAY_PROPS).join(', ') +
                (propsArray.length > MAX_DISPLAY_PROPS ? '...' : '');

              context.report({
                node: scopeNode,
                message: `对象 \`${objectName}\` 的多个属性被频繁访问 (${properties.size} 次: ${displayProps})。请在顶部使用解构赋值 (如: const { ... } = ${objectName}) 提高代码可读性。`,
              });
            }
          }
        }
      },
    };
  },
};
