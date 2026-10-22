import { isExemptFile } from '../../utils/is-exempt-file.js';
import { isFunctionValue } from '../../utils/is-function-value.js';
import { ruleDocsUrl } from '../../utils/rule-docs-url.js';

/*
 * 改名要一次改到位：声明本身与本文件内所有引用都收进来。
 * 作用域信息缺失时至少改写声明本身，避免返回空 fix 让告警看起来可修实际不动。
 */
function collectRenameTargets(sourceCode, interfaceNode) {
  const idNodes = [];
  for (const variable of sourceCode.getDeclaredVariables(interfaceNode)) {
    for (const def of variable.defs) {
      // 没有标识符节点的定义要滤掉，避免把 undefined 交给 fixer
      if (def.name) {
        idNodes.push(def.name);
      }
    }
    for (const ref of variable.references) {
      idNodes.push(ref.identifier);
    }
  }

  if (idNodes.length === 0) {
    return [interfaceNode.id];
  }
  return idNodes;
}

/**
 * autofix 只改写当前文件内的引用；跨文件引用需另行处理。
 * `type XxxProps = {}` 由 consistent-type-definitions 先转成 interface，不单独处理。
 */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Props 接口必须使用「组件名Props」命名格式',
      url: ruleDocsUrl('props-interface-naming'),
    },
    fixable: 'code',
    schema: [],
    messages: {
      propsNaming: 'Props 接口应命名为 `{{expected}}`（当前：`{{actual}}`）',
    },
  },
  create(context) {
    const { filename, sourceCode } = context;

    // 测试里的包装组件常复用被测组件的 Props 类型，一并豁免
    if (!filename.endsWith('.tsx') || isExemptFile(filename)) {
      return {};
    }

    const interfaces = [];
    const components = [];

    function propsTypeRefName(annotation) {
      if (annotation?.type !== 'TSTypeReference') {
        return null;
      }
      const typeName = annotation.typeName?.name;
      return typeName?.endsWith('Props') === true ? typeName : null;
    }

    function propsNameFromParam(fnNode) {
      const firstParam = fnNode.params[0];
      return propsTypeRefName(firstParam?.typeAnnotation?.typeAnnotation);
    }

    function propsNameFromFcAnnotation(idNode) {
      const annotation = idNode.typeAnnotation?.typeAnnotation;
      if (annotation?.type !== 'TSTypeReference') {
        return null;
      }
      // typeArguments / typeParameters 两种字段名都要兜底
      const typeArgs = annotation.typeArguments ?? annotation.typeParameters;
      return propsTypeRefName(typeArgs?.params?.[0]);
    }

    return {
      // interface 的名字由语法保证存在，无需判空
      'TSInterfaceDeclaration'(node) {
        interfaces.push({ node, name: node.id.name });
      },

      'VariableDeclarator'(node) {
        if (
          node.id.type === 'Identifier' &&
          /^[A-Z]/.test(node.id.name) &&
          isFunctionValue(node.init)
        ) {
          const propsTypeName = propsNameFromParam(node.init) ?? propsNameFromFcAnnotation(node.id);
          if (propsTypeName) {
            components.push({ name: node.id.name, propsTypeName });
          }
        }
      },

      'FunctionDeclaration'(node) {
        // 匿名默认导出函数无 id，跳过
        const componentName = node.id?.name;
        if (componentName === undefined || !/^[A-Z]/.test(componentName)) {
          return;
        }

        const propsTypeName = propsNameFromParam(node);
        if (propsTypeName) {
          components.push({ name: componentName, propsTypeName });
        }
      },

      'Program:exit'() {
        // 多个组件共用同一 interface 时期望名会互相冲突，故先计数
        const componentCountByProps = new Map();
        for (const component of components) {
          const count = componentCountByProps.get(component.propsTypeName) ?? 0;
          componentCountByProps.set(component.propsTypeName, count + 1);
        }

        // 用于避免重命名后与现有 interface 声明重名
        const existingNames = new Set(interfaces.map((declaration) => declaration.name));

        for (const component of components) {
          const expectedPropsName = `${component.name}Props`;
          if (component.propsTypeName === expectedPropsName) {
            continue;
          }

          const matchingInterface = interfaces.find(
            (declaration) => declaration.name === component.propsTypeName,
          );
          if (!matchingInterface) {
            continue;
          }

          // 计数表由 components 本身构建，故当前组件的 propsTypeName 必然在表内
          const isShared = componentCountByProps.get(component.propsTypeName) > 1;
          const isNameTaken = existingNames.has(expectedPropsName);
          // 期望名形如 IXxx 会命中 naming-convention 的接口禁令，改名反而产出非法代码，故只告警不 fix
          const hasInterfaceIPrefix = /^I[A-Z]/.test(expectedPropsName);
          // 导出的接口可能被别处 import，本文件内改名会让导入方编译失败，故只报不修
          const isExported = matchingInterface.node.parent?.type === 'ExportNamedDeclaration';
          const canFix = !isShared && !isNameTaken && !hasInterfaceIPrefix && !isExported;

          context.report({
            node: matchingInterface.node.id,
            messageId: 'propsNaming',
            data: { expected: expectedPropsName, actual: component.propsTypeName },
            fix: canFix
              ? (fixer) =>
                  collectRenameTargets(sourceCode, matchingInterface.node).map((idNode) =>
                    fixer.replaceText(idNode, expectedPropsName),
                  )
              : null,
          });
        }
      },
    };
  },
};
