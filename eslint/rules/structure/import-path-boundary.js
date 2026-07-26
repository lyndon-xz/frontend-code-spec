import path from 'path';

import { normalizePath } from '../../utils/normalize-path.js';

/**
 * 模块内部使用相对路径，跨模块引用使用 @/ 别名。
 *
 * 与 import/order 的 fix 关系：本规则只改写 import 源字符串（@/x ↔ ./x），import/order 只调整
 * import 语句顺序，二者作用在正交维度上，互不覆盖对方的 fix 结果。改写是幂等的（相对/别名一旦
 * 落到目标形态就不会再被本规则触碰），因此在 ESLint 多轮 fix 下必然收敛：先由本规则定形路径，
 * import/order 再据最终路径归组排序，不会来回抖动或死循环。
 */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '模块内部使用相对路径，跨模块引用使用 @/ 别名',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          srcDir: {
            type: 'string',
            default: 'src',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      useRelative: '模块内部引用请使用相对路径，不要使用 @/ 别名（当前模块：{{module}}/）',
      useAlias:
        '跨模块引用请使用 @/ 别名（从 {{current}}/ 引用 {{target}}/），如：@/{{targetPath}}',
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const srcDirName = options.srcDir ?? 'src';

    // 归一为正斜杠后提取 src/ 之后的部分；后续所有路径运算都在「相对 src 的 posix 空间」里进行，
    // 全是相对正斜杠字符串（无盘符、无 OS 分隔符、不依赖 cwd），从而跨平台稳定、修复输出恒为合法 import 路径。
    const filename = normalizePath(context.filename);
    const srcIndex = filename.lastIndexOf(`/${srcDirName}/`);
    if (srcIndex === -1) {
      return {};
    }

    // 当前文件相对 src 的路径（如 'apis/foo.ts'）及其所属一级模块（如 'apis'）
    const relativeToSrc = filename.substring(srcIndex + srcDirName.length + 2);
    const currentModule = relativeToSrc.split('/')[0];
    // 当前文件所在目录（相对 src），顶层文件时为 '.'
    const currentDir = path.posix.dirname(relativeToSrc);

    return {
      ImportDeclaration(node) {
        const source = node.source.value;

        // 只处理 @/ 开头的别名导入和 ./ ../ 开头的相对导入
        if (!source.startsWith('@/') && !source.startsWith('../') && !source.startsWith('./')) {
          return;
        }

        // ---- @/ 别名导入：@/ 后即 src 下路径 ----
        if (source.startsWith('@/')) {
          const importPath = source.substring(2);
          const targetModule = importPath.split('/')[0];

          // 跨模块用别名 → 合规；仅同模块需改回相对路径
          if (targetModule !== currentModule) {
            return;
          }

          let relativePath = path.posix.relative(currentDir, importPath);
          if (!relativePath.startsWith('.')) {
            relativePath = './' + relativePath;
          }

          context.report({
            node: node.source,
            messageId: 'useRelative',
            data: { module: currentModule },
            fix(fixer) {
              return fixer.replaceText(node.source, `'${relativePath}'`);
            },
          });
          return;
        }

        // ---- 相对路径导入：只关注向上跨目录的 ../ ----
        if (!source.startsWith('../')) {
          // 同级 ./ 导入肯定是模块内部，跳过
          return;
        }

        // 在 src 相对空间解析目标路径
        const targetRelativeToSrc = path.posix.join(currentDir, source);

        // 逃出 src（.. 开头）→ 非 src 内引用，跳过
        if (targetRelativeToSrc.startsWith('..')) {
          return;
        }

        const targetModule = targetRelativeToSrc.split('/')[0];
        if (targetModule !== currentModule) {
          context.report({
            node: node.source,
            messageId: 'useAlias',
            data: { current: currentModule, target: targetModule, targetPath: targetRelativeToSrc },
            fix(fixer) {
              return fixer.replaceText(node.source, `'@/${targetRelativeToSrc}'`);
            },
          });
        }
      },
    };
  },
};
