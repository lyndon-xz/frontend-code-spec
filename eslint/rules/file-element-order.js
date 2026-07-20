import { isExemptFile } from '../utils/is-exempt-file.js';

const MIN_STATEMENTS_TO_CHECK = 3;

/**
 * 文件内代码元素排序：类型定义 → 常量 → 辅助函数 → 主导出
 *
 * 分类逻辑：
 * - types: interface/type 声明
 * - constants: const + UPPER_CASE 变量
 * - helpers: 非导出函数/箭头函数
 * - exports: export 声明
 *
 * 仅报错、不自动修复：顶层元素重排若要同时正确保留前导文档注释、分节注释、
 * 文件头 banner 与空行，只能依赖启发式，边界场景仍可能错放或丢失注释（--fix 数据损坏级风险）。
 * 因此这里只定位并报告违规，由开发者手动重排，避免自动修复破坏注释归属。
 */
export default {
  meta: {
    type: 'layout',
    docs: {
      description: '强制文件内代码元素按「类型 → 常量 → 辅助函数 → 主导出」顺序排列',
    },
    fixable: null,
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename?.();

    // 仅对 src 下的业务文件生效，排除测试 / mock / 类型声明 / 配置
    if (!filename || isExemptFile(filename)) {
      return {};
    }

    // 分类优先级
    const CATEGORY_ORDER = {
      import: 0,
      type: 1,
      constant: 2,
      helper: 3,
      export: 4,
    };

    function categorize(node) {
      // import 语句
      if (node.type === 'ImportDeclaration') {
        return 'import';
      }

      // export default — 主导出
      if (node.type === 'ExportDefaultDeclaration') {
        return 'export';
      }

      // export named
      if (node.type === 'ExportNamedDeclaration') {
        const decl = node.declaration;
        if (!decl) return 'export';

        // export interface / export type
        if (decl.type === 'TSInterfaceDeclaration' || decl.type === 'TSTypeAliasDeclaration') {
          return 'type';
        }

        // export const UPPER_CASE
        if (decl.type === 'VariableDeclaration' && decl.kind === 'const') {
          const allUpper = decl.declarations.every(
            (d) => d.id.type === 'Identifier' && /^[A-Z_][A-Z0-9_]*$/.test(d.id.name),
          );
          if (allUpper) return 'constant';
        }

        // export enum
        if (decl.type === 'TSEnumDeclaration') {
          return 'constant';
        }

        // 其余 export (函数、变量等)
        return 'export';
      }

      // interface / type 声明
      if (node.type === 'TSInterfaceDeclaration' || node.type === 'TSTypeAliasDeclaration') {
        return 'type';
      }

      // TSEnumDeclaration (非 export)
      if (node.type === 'TSEnumDeclaration') {
        return 'constant';
      }

      // VariableDeclaration
      if (node.type === 'VariableDeclaration') {
        if (node.kind === 'const') {
          // UPPER_CASE 常量
          const allUpper = node.declarations.every(
            (d) => d.id.type === 'Identifier' && /^[A-Z_][A-Z0-9_]*$/.test(d.id.name),
          );
          if (allUpper) return 'constant';

          // 箭头函数/函数表达式 → helper
          const allFunctions = node.declarations.every(
            (d) => d.init && (d.init.type === 'ArrowFunctionExpression' || d.init.type === 'FunctionExpression'),
          );
          if (allFunctions) return 'helper';
        }

        // 其余变量视为 constant 层（普通 const 值）
        if (node.kind === 'const') return 'constant';
        return 'helper';
      }

      // FunctionDeclaration
      if (node.type === 'FunctionDeclaration') {
        return 'helper';
      }

      // 其余（如 ExpressionStatement）保持原位
      return null;
    }

    return {
      Program(programNode) {
        const body = programNode.body;

        if (body.length < MIN_STATEMENTS_TO_CHECK) return;

        // 对每个节点分类
        const categorized = body.map((node) => ({
          node,
          category: categorize(node),
          order: CATEGORY_ORDER[categorize(node)] ?? -1,
        }));

        // 检查是否已有序（跳过 import 和无法分类的节点）
        const meaningful = categorized.filter((c) => c.category && c.category !== 'import');

        let hasViolation = false;
        for (let i = 1; i < meaningful.length; i++) {
          if (meaningful[i].order < meaningful[i - 1].order) {
            hasViolation = true;
            break;
          }
        }

        if (!hasViolation) return;

        // 找到第一个违规节点报错
        for (let i = 1; i < meaningful.length; i++) {
          if (meaningful[i].order < meaningful[i - 1].order) {
            const violatingNode = meaningful[i].node;
            const expectedCategory = meaningful[i].category;
            const prevCategory = meaningful[i - 1].category;

            context.report({
              node: violatingNode,
              message: `代码元素顺序错误：\`${expectedCategory}\` 不应出现在 \`${prevCategory}\` 之后（正确顺序：type → constant → helper → export）`,
            });
            break;
          }
        }
      },
    };
  },
};
