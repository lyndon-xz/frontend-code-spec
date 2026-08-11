import path from 'path';

import { isExemptFile } from '../../utils/is-exempt-file.js';
import { normalizePath } from '../../utils/normalize-path.js';
import { DEFAULT_SRC_DIR } from '../../utils/source-layout.js';

// 选项默认值的唯一来源：schema 的 default 与 create 里的取值都引用此处
const DEFAULT_OPTIONS = {
  srcDir: DEFAULT_SRC_DIR,
};

/**
 * 本规则只改写 import 源字符串（@/x ↔ ./x），import/order 只调整语句顺序，二者正交。
 * 改写幂等，故 ESLint 多轮 fix 必然收敛，不会抖动或死循环。
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
            default: DEFAULT_OPTIONS.srcDir,
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
    const { srcDir } = { ...DEFAULT_OPTIONS, ...context.options[0] };

    /*
     * 后续路径运算都在「相对 src 的 posix 空间」里进行：无盘符、无 OS 分隔符、不依赖 cwd，
     * 从而跨平台稳定、修复输出恒为合法 import 路径。
     */
    const filename = normalizePath(context.filename);

    // __tests__ 镜像目录与被测模块不同层，按 @/ 引用是约定写法，改成相对路径既冗长又随文件移动失效
    if (isExemptFile(filename)) {
      return {};
    }

    const srcIndex = filename.lastIndexOf(`/${srcDir}/`);
    if (srcIndex === -1) {
      return {};
    }

    // +2 跳过 srcDir 前后的两个斜杠，得到 'apis/foo.ts' 这样的相对路径
    const relativeToSrc = filename.substring(srcIndex + srcDir.length + 2);
    const currentModule = relativeToSrc.split('/')[0];
    // 顶层文件时为 '.'
    const currentDir = path.posix.dirname(relativeToSrc);

    return {
      ImportDeclaration(node) {
        const source = node.source.value;

        // 只管仓库内引用；裸包名（react、@scope/pkg）不在本规则约束范围
        if (!source.startsWith('@/') && !source.startsWith('../') && !source.startsWith('./')) {
          return;
        }

        // @/ 别名导入：@/ 后即 src 下路径
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

        // 相对路径导入只关注向上跨目录的 ../，同级 ./ 肯定是模块内部
        if (!source.startsWith('../')) {
          return;
        }

        const targetRelativeToSrc = path.posix.join(currentDir, source);

        // .. 开头说明逃出了 src，非 src 内引用
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
