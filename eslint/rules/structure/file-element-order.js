import { isExemptFile } from '../../utils/is-exempt-file.js';

const MIN_STATEMENTS_TO_CHECK = 3;

// 分类优先级：import → type → constant → helper → export
const CATEGORY_ORDER = {
  import: 0,
  type: 1,
  constant: 2,
  helper: 3,
  export: 4,
};

// 判断一组声明是否全为 UPPER_CASE 常量标识符
function isAllUpperConst(declarations) {
  return declarations.every(
    (d) => d.id.type === 'Identifier' && /^[A-Z_][A-Z0-9_]*$/.test(d.id.name),
  );
}

// 判断一组声明是否全为函数表达式/箭头函数
function isAllFunction(declarations) {
  return declarations.every(
    (d) =>
      d.init && (d.init.type === 'ArrowFunctionExpression' || d.init.type === 'FunctionExpression'),
  );
}

// 把顶层语句归类到 import / type / constant / helper / export，无法归类返回 null（保持原位）
function categorize(node) {
  if (node.type === 'ImportDeclaration') return 'import';

  // export default — 主导出
  if (node.type === 'ExportDefaultDeclaration') return 'export';

  // export named
  if (node.type === 'ExportNamedDeclaration') {
    const decl = node.declaration;
    if (!decl) return 'export';
    if (decl.type === 'TSInterfaceDeclaration' || decl.type === 'TSTypeAliasDeclaration')
      return 'type';
    if (
      decl.type === 'VariableDeclaration' &&
      decl.kind === 'const' &&
      isAllUpperConst(decl.declarations)
    ) {
      return 'constant';
    }
    if (decl.type === 'TSEnumDeclaration') return 'constant';
    return 'export';
  }

  // interface / type 声明
  if (node.type === 'TSInterfaceDeclaration' || node.type === 'TSTypeAliasDeclaration')
    return 'type';

  // enum（非 export）
  if (node.type === 'TSEnumDeclaration') return 'constant';

  // VariableDeclaration
  if (node.type === 'VariableDeclaration') {
    if (node.kind === 'const') {
      if (isAllUpperConst(node.declarations)) return 'constant';
      if (isAllFunction(node.declarations)) return 'helper';
      return 'constant';
    }
    return 'helper';
  }

  if (node.type === 'FunctionDeclaration') return 'helper';

  // 其余（如 ExpressionStatement）保持原位
  return null;
}

/**
 * 文件内代码元素排序：类型定义 → 常量 → 辅助函数 → 主导出。
 *
 * 仅报错、不自动修复：顶层元素重排若要同时正确保留前导文档注释、分节注释、文件头 banner 与空行，
 * 只能依赖启发式，边界场景仍可能错放或丢失注释（--fix 数据损坏级风险）。因此只定位并报告违规，由开发者手动重排。
 */
export default {
  meta: {
    type: 'layout',
    docs: {
      description: '强制文件内代码元素按「类型 → 常量 → 辅助函数 → 主导出」顺序排列',
    },
    fixable: null,
    schema: [],
    messages: {
      wrongOrder:
        '代码元素顺序错误：`{{current}}` 不应出现在 `{{prev}}` 之后（正确顺序：type → constant → helper → export）',
    },
  },
  create(context) {
    const { filename } = context;

    // 仅对 src 下的业务文件生效，排除测试 / mock / 类型声明 / 配置
    if (!filename || isExemptFile(filename)) {
      return {};
    }

    return {
      Program(programNode) {
        const { body } = programNode;
        if (body.length < MIN_STATEMENTS_TO_CHECK) return;

        // 分类并过滤：跳过 import 与无法分类的节点
        const meaningful = body
          .map((node) => {
            const category = categorize(node);
            return { node, category, order: CATEGORY_ORDER[category] };
          })
          .filter((item) => item.category && item.category !== 'import');

        // 找到第一个「比前一个元素优先级更靠前」的违规并报告
        for (let i = 1; i < meaningful.length; i++) {
          if (meaningful[i].order < meaningful[i - 1].order) {
            context.report({
              node: meaningful[i].node,
              messageId: 'wrongOrder',
              data: { current: meaningful[i].category, prev: meaningful[i - 1].category },
            });
            break;
          }
        }
      },
    };
  },
};
