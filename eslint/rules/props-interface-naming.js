export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Props 接口必须使用「组件名Props」命名格式',
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename?.();

    // 仅对 .tsx 文件生效
    if (!filename || !filename.endsWith('.tsx')) {
      return {};
    }

    // 收集 interface 声明，元素形态 { node, name }
    const interfaces = [];
    // 收集函数组件，元素形态 { name }
    const components = [];

    return {
      // 收集 interface 声明
      TSInterfaceDeclaration(node) {
        if (node.id && node.id.type === 'Identifier') {
          interfaces.push({ node, name: node.id.name });
        }
      },

      // 收集函数组件 — const Xxx = (props: XxxProps) => {}
      VariableDeclarator(node) {
        if (
          node.id.type === 'Identifier' &&
          /^[A-Z]/.test(node.id.name) &&
          node.init &&
          (node.init.type === 'ArrowFunctionExpression' || node.init.type === 'FunctionExpression')
        ) {
          const params = node.init.params;
          if (params.length > 0 && params[0].typeAnnotation) {
            const annotation = params[0].typeAnnotation.typeAnnotation;
            if (annotation && annotation.type === 'TSTypeReference' && annotation.typeName) {
              const typeName = annotation.typeName.name;
              if (typeName && typeName.endsWith('Props')) {
                components.push({
                  name: node.id.name,
                  propsTypeName: typeName,
                  propsTypeNode: annotation.typeName,
                });
              }
            }
          }
        }
      },

      // 收集 function Xxx(props: XxxProps) {}
      FunctionDeclaration(node) {
        if (node.id && /^[A-Z]/.test(node.id.name)) {
          const params = node.params;
          if (params.length > 0 && params[0].typeAnnotation) {
            const annotation = params[0].typeAnnotation.typeAnnotation;
            if (annotation && annotation.type === 'TSTypeReference' && annotation.typeName) {
              const typeName = annotation.typeName.name;
              if (typeName && typeName.endsWith('Props')) {
                components.push({
                  name: node.id.name,
                  propsTypeName: typeName,
                  propsTypeNode: annotation.typeName,
                });
              }
            }
          }
        }
      },

      'Program:exit'() {
        for (const component of components) {
          const expectedPropsName = `${component.name}Props`;

          if (component.propsTypeName !== expectedPropsName) {
            // 找到对应的 interface 声明
            const matchingInterface = interfaces.find((i) => i.name === component.propsTypeName);

            if (matchingInterface) {
              context.report({
                node: matchingInterface.node.id,
                message: `Props 接口应命名为 \`${expectedPropsName}\`（当前：\`${component.propsTypeName}\`）`,
                fix(fixer) {
                  const fixes = [];
                  // 重命名 interface 声明
                  fixes.push(fixer.replaceText(matchingInterface.node.id, expectedPropsName));
                  // 重命名使用处
                  fixes.push(fixer.replaceText(component.propsTypeNode, expectedPropsName));
                  return fixes;
                },
              });
            }
          }
        }
      },
    };
  },
};
