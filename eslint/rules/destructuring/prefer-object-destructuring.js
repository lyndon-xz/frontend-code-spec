import { isExemptFile } from '../../utils/is-exempt-file.js';

const MAX_DISPLAY_PROPS = 3;

// 选项默认值的唯一来源：schema 的 default 与 create 里的取值都引用此处
const DEFAULT_OPTIONS = {
  maxAccessCount: 2,
  additionalIgnoredObjects: [],
};

/*
 * 默认忽略的全局/内建对象：对它们做多属性访问不应强制解构。
 * 领域对象（如样式模块 styles）不写死在规则里，改由 config 的 additionalIgnoredObjects 传入，避免业务知识漏进通用规则。
 */
const DEFAULT_IGNORED_OBJECTS = [
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
];

/*
 * 该成员访问是否为写操作目标：赋值左侧（u.a = 1）、自增自减（u.a++）、delete（delete u.a）。
 * 解构只能替代「读」，把写操作计入统计会给出改坏代码的建议——解构后写的是局部变量，原对象不再被修改。
 */
function isWriteTarget(node) {
  const { parent } = node;
  if (parent.type === 'AssignmentExpression') return parent.left === node;
  if (parent.type === 'UpdateExpression') return parent.argument === node;
  if (parent.type === 'UnaryExpression') return parent.operator === 'delete';
  return false;
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        '当同一对象在同一函数作用域内被访问的不同属性数超过阈值（maxAccessCount，默认 2，即出现第 3 个不同属性）时，强制改用解构赋值',
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          maxAccessCount: {
            type: 'number',
            default: DEFAULT_OPTIONS.maxAccessCount,
          },
          additionalIgnoredObjects: {
            type: 'array',
            items: { type: 'string' },
            default: DEFAULT_OPTIONS.additionalIgnoredObjects,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      preferDestructuring:
        '对象 `{{objectName}}` 被访问了 {{count}} 个不同属性 ({{displayProps}})。请在函数顶部使用解构赋值 (如: const {{braces}} = {{objectName}}) 提高代码可读性。',
    },
  },
  create(context) {
    /*
     * 测试 / mock 文件豁免：桩对象与断言常密集读取同一对象的多个属性
     * （如 mock.calls / mock.results），改成解构反而割裂断言语境。
     */
    if (isExemptFile(context.filename)) return {};

    const { maxAccessCount, additionalIgnoredObjects } = {
      ...DEFAULT_OPTIONS,
      ...context.options[0],
    };
    const ignoredObjects = new Set([...DEFAULT_IGNORED_OBJECTS, ...additionalIgnoredObjects]);

    // 记录每个作用域下的对象访问情况
    const scopeTracker = new Map();

    return {
      MemberExpression(node) {
        // 只处理 identifier.property 形式，如 user.name，忽略 user[key] 或 foo.bar.baz (只统计 foo.bar)
        if (
          node.object.type === 'Identifier' &&
          node.property.type === 'Identifier' &&
          !node.computed
        ) {
          const objectName = node.object.name;
          const propertyName = node.property.name;

          // 忽略特例
          if (ignoredObjects.has(objectName)) return;
          // 忽略大写开头的类/枚举访问 (例如：UserStatus.ACTIVE)
          if (/^[A-Z]/.test(objectName)) return;

          // 忽略方法调用 (例如 redirectLink.click()、arr.map())
          if (node.parent.type === 'CallExpression' && node.parent.callee === node) {
            return;
          }

          // 写操作目标不计入统计
          if (isWriteTarget(node)) return;

          /*
           * 按最近的函数/模块作用域聚合，而非块级作用域：
           * 散落在同一函数内不同 if/for 块里的属性访问应合并统计，才与「在函数顶部解构」的建议一致。
           */
          const scope = context.sourceCode.getScope(node);
          const scopeNode = scope.variableScope.block;

          if (!scopeTracker.has(scopeNode)) {
            scopeTracker.set(scopeNode, new Map());
          }

          const objectMap = scopeTracker.get(scopeNode);
          if (!objectMap.has(objectName)) {
            // node 记录该对象首次出现的成员访问节点，用于把报错精确定位到源码位置
            objectMap.set(objectName, { props: new Set(), node });
          }

          // 记录访问过的属性
          objectMap.get(objectName).props.add(propertyName);
        }
      },

      'Program:exit'() {
        for (const objectMap of scopeTracker.values()) {
          for (const [objectName, { props, node }] of objectMap.entries()) {
            if (props.size > maxAccessCount) {
              const propsArray = Array.from(props);
              const displayProps =
                propsArray.slice(0, MAX_DISPLAY_PROPS).join(', ') +
                (propsArray.length > MAX_DISPLAY_PROPS ? '...' : '');

              // 报在该对象首次出现的成员访问处，精确定位而非挂在整个作用域块上
              context.report({
                node,
                messageId: 'preferDestructuring',
                data: {
                  objectName,
                  count: props.size,
                  displayProps,
                  braces: '{ ... }',
                },
              });
            }
          }
        }
      },
    };
  },
};
