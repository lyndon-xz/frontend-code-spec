import { isExemptFile } from '../../utils/is-exempt-file.js';
import { isFunctionNode } from '../../utils/is-function-node.js';

/**
 * 收集组件与其 Props 类型（首参标注或 React.FC 泛型参数），命名不为 `${组件名}Props` 则重命名 interface。
 * `type XxxProps = {}` 由 consistent-type-definitions 先转成 interface，故不单独处理。
 *
 * autofix 走作用域引用改写当前文件内的全部引用（声明、参数标注、extends、泛型），避免遗漏引用改坏代码。
 * 修复只作用于当前文件：interface 被导出并在别处按旧名引用时，跨文件引用需另行处理。
 */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Props 接口必须使用「组件名Props」命名格式',
    },
    fixable: 'code',
    schema: [],
    messages: {
      propsNaming: 'Props 接口应命名为 `{{expected}}`（当前：`{{actual}}`）',
    },
  },
  create(context) {
    const { filename, sourceCode } = context;

    // 测试里的包装组件常复用被测组件的 Props 类型，按组件名改名会改坏引用，故一并豁免
    if (!filename.endsWith('.tsx') || isExemptFile(filename)) {
      return {};
    }

    const interfaces = [];
    const components = [];

    function typeRefName(annotation) {
      if (annotation?.type !== 'TSTypeReference') return null;
      const typeName = annotation.typeName?.name;
      return typeName?.endsWith('Props') === true ? typeName : null;
    }

    // 首参类型标注：(props: XxxProps)
    function propsNameFromParam(fnNode) {
      const firstParam = fnNode.params[0];
      return typeRefName(firstParam?.typeAnnotation?.typeAnnotation);
    }

    // 变量类型标注的首个泛型参数：const C: React.FC<XxxProps> = ...
    function propsNameFromFcAnnotation(idNode) {
      const annotation = idNode.typeAnnotation?.typeAnnotation;
      if (annotation?.type !== 'TSTypeReference') return null;
      // typeArguments / typeParameters 两种字段名都要兜底
      const typeArgs = annotation.typeArguments ?? annotation.typeParameters;
      return typeRefName(typeArgs?.params?.[0]);
    }

    return {
      // interface 的名字由语法保证存在，无需判空
      'TSInterfaceDeclaration'(node) {
        interfaces.push({ node, name: node.id.name });
      },

      // const Xxx = (props: XxxProps) => {} 或 const Xxx: React.FC<XxxProps> = () => {}
      'VariableDeclarator'(node) {
        if (
          node.id.type === 'Identifier' &&
          /^[A-Z]/.test(node.id.name) &&
          isFunctionNode(node.init)
        ) {
          const propsTypeName = propsNameFromParam(node.init) ?? propsNameFromFcAnnotation(node.id);
          if (propsTypeName) {
            components.push({ name: node.id.name, propsTypeName });
          }
        }
      },

      // function Xxx(props: XxxProps) {}
      'FunctionDeclaration'(node) {
        // 匿名默认导出函数无 id，跳过
        const componentName = node.id?.name;
        if (componentName === undefined || !/^[A-Z]/.test(componentName)) return;

        const propsTypeName = propsNameFromParam(node);
        if (propsTypeName) {
          components.push({ name: componentName, propsTypeName });
        }
      },

      'Program:exit'() {
        // 识别「多个组件共用同一 interface」的期望名冲突
        const componentCountByProps = new Map();
        for (const component of components) {
          const count = componentCountByProps.get(component.propsTypeName) ?? 0;
          componentCountByProps.set(component.propsTypeName, count + 1);
        }

        // 用于避免重命名后与现有 interface 声明重名
        const existingNames = new Set(interfaces.map((item) => item.name));

        for (const component of components) {
          const expectedPropsName = `${component.name}Props`;
          if (component.propsTypeName === expectedPropsName) continue;

          const matchingInterface = interfaces.find(
            (item) => item.name === component.propsTypeName,
          );
          if (!matchingInterface) continue;

          // 计数表由 components 本身构建，故当前组件的 propsTypeName 必然在表内
          const isShared = componentCountByProps.get(component.propsTypeName) > 1;
          const isNameTaken = existingNames.has(expectedPropsName);
          /*
           * 组件名形如 IXxx 时期望名会命中 naming-convention 的 ^I[A-Z] 接口禁令，
           * 自动改名反而产出被另一条规则判非法的代码，故只告警不 fix
           */
          const violatesInterfaceIPrefix = /^I[A-Z]/.test(expectedPropsName);
          const canFix = !isShared && !isNameTaken && !violatesInterfaceIPrefix;

          context.report({
            node: matchingInterface.node.id,
            messageId: 'propsNaming',
            data: { expected: expectedPropsName, actual: component.propsTypeName },
            fix: canFix
              ? (fixer) => {
                  const variables = sourceCode.getDeclaredVariables(matchingInterface.node);
                  const idNodes = [];
                  for (const variable of variables) {
                    for (const def of variable.defs) {
                      // 没有标识符节点的定义要滤掉，避免把 undefined 交给 fixer
                      if (def.name) idNodes.push(def.name);
                    }
                    for (const ref of variable.references) {
                      idNodes.push(ref.identifier);
                    }
                  }
                  // 兜底：作用域信息缺失时，至少改写声明本身
                  if (idNodes.length === 0) idNodes.push(matchingInterface.node.id);

                  return idNodes.map((idNode) => fixer.replaceText(idNode, expectedPropsName));
                }
              : null,
          });
        }
      },
    };
  },
};
