import { isExemptFile } from '../../utils/is-exempt-file.js';
import { isFunctionNode } from '../../utils/is-function-node.js';

/**
 * Props 接口必须使用「组件名Props」命名格式。
 * 仅对 .tsx 生效；收集组件与其 Props 类型（首参标注或 React.FC 泛型参数），
 * 若命名不为 `${组件名}Props` 则重命名对应 interface。
 *
 * 覆盖范围：
 * - Props 类型声明：`interface XxxProps {}`
 *   （`type XxxProps = {}` 由 `@typescript-eslint/consistent-type-definitions` 统一转为 interface 后再由本规则接管，故不单独处理）；
 * - 组件形态：`function C(props: XxxProps)`、`const C = (props: XxxProps) => {}`、
 *   `const C: React.FC<XxxProps> = () => {}`。
 *
 * autofix 安全策略：
 * - 通过作用域引用重命名该 interface 在「当前文件内」的全部引用（声明、参数标注、extends、泛型等），
 *   而非只改声明与单个使用处，避免遗漏引用导致改坏代码；
 * - 同一 interface 被多个组件共用时，各自期望名互相冲突，无法自动满足，只告警不 fix；
 * - 目标名已被其它 interface 占用时，为避免产生重名声明，只告警不 fix；
 * - 注意：ESLint 自动修复只作用于当前文件，若该 interface 被导出并被其它文件按旧名引用，
 *   跨文件引用需另行处理（本规则无法感知其它文件）。
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

    /*
     * 仅对 .tsx 生效；测试 / mock 里的包装组件常直接复用被测组件的 Props 类型
     * （如 const Wrapper = (props: FlightCardProps) => ...），按组件名改名会改坏引用，故一并豁免。
     */
    if (!filename.endsWith('.tsx') || isExemptFile(filename)) {
      return {};
    }

    // 收集 interface 声明，元素形态 { node, name }
    const interfaces = [];
    // 收集函数组件，元素形态 { name, propsTypeName }
    const components = [];

    // 从 TSTypeReference 取名字，仅当其以 Props 结尾时返回，否则返回 null
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
      // typescript-eslint v8 用 typeArguments，旧版用 typeParameters，两者都兜底
      const typeArgs = annotation.typeArguments ?? annotation.typeParameters;
      return typeRefName(typeArgs?.params?.[0]);
    }

    return {
      // 收集 interface 声明
      TSInterfaceDeclaration(node) {
        if (node.id?.type === 'Identifier') {
          interfaces.push({ node, name: node.id.name });
        }
      },

      // 收集函数组件 — const Xxx = (props: XxxProps) => {} 或 const Xxx: React.FC<XxxProps> = () => {}
      VariableDeclarator(node) {
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

      // 收集 function Xxx(props: XxxProps) {}
      FunctionDeclaration(node) {
        // 匿名默认导出函数无 id，跳过
        const componentName = node.id?.name;
        if (componentName === undefined || !/^[A-Z]/.test(componentName)) return;

        const propsTypeName = propsNameFromParam(node);
        if (propsTypeName) {
          components.push({ name: componentName, propsTypeName });
        }
      },

      'Program:exit'() {
        // 统计每个 Props 类型被多少个组件引用，用于识别「共用同一 interface」的冲突
        const componentCountByProps = new Map();
        for (const component of components) {
          const count = componentCountByProps.get(component.propsTypeName) ?? 0;
          componentCountByProps.set(component.propsTypeName, count + 1);
        }

        // 已存在的 interface 名，用于避免重命名后与现有声明重名
        const existingNames = new Set(interfaces.map((item) => item.name));

        for (const component of components) {
          const expectedPropsName = `${component.name}Props`;
          if (component.propsTypeName === expectedPropsName) continue;

          // 找到对应的 interface 声明
          const matchingInterface = interfaces.find(
            (item) => item.name === component.propsTypeName,
          );
          if (!matchingInterface) continue;

          // 无法安全自动修复：多个组件共用同一 interface（期望名互相冲突），或目标名已被占用
          const isShared = (componentCountByProps.get(component.propsTypeName) ?? 0) > 1;
          const isNameTaken = existingNames.has(expectedPropsName);
          /*
           * 组件名形如 IXxx（I 后紧跟大写）时，期望名会命中 @typescript-eslint/naming-convention
           * 的 ^I[A-Z] 接口禁令，自动改名反而产出被另一条规则判非法的代码，故此情形只告警不 fix
           */
          const violatesInterfaceIPrefix = /^I[A-Z]/.test(expectedPropsName);
          const canFix = !isShared && !isNameTaken && !violatesInterfaceIPrefix;

          context.report({
            node: matchingInterface.node.id,
            messageId: 'propsNaming',
            data: { expected: expectedPropsName, actual: component.propsTypeName },
            fix: canFix
              ? (fixer) => {
                  // 基于作用域，重命名该 interface 在当前文件内的全部引用（声明 + 类型引用）
                  const variables = sourceCode.getDeclaredVariables(matchingInterface.node);
                  const idNodes = [];
                  for (const variable of variables) {
                    for (const def of variable.defs) {
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
