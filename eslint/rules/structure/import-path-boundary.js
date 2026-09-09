import path from 'path';

import { isExemptFile } from '../../utils/is-exempt-file.js';
import { DEFAULT_SRC_DIR } from '../../utils/source-layout.js';
import { toPosixPath } from '../../utils/to-posix-path.js';

// 选项默认值的唯一来源：schema 的 default 与 create 里的取值都引用此处
const DEFAULT_OPTIONS = {
  srcDir: DEFAULT_SRC_DIR,
};

/** 只改写 import 源字符串，与只调语句顺序的 import/order 正交 */
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
            // 空串会让 lastIndexOf('//') 恒为 -1，整条规则静默失效
            minLength: 1,
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

    // 后续路径运算都在「相对 src 的 posix 空间」里进行
    const filename = toPosixPath(context.filename);

    // __tests__ 与被测模块不同层，用 @/ 引用是约定写法
    if (isExemptFile(filename)) {
      return {};
    }

    const srcSegment = `/${srcDir}/`;
    const srcIndex = filename.lastIndexOf(srcSegment);
    if (srcIndex === -1) {
      return {};
    }

    const relativeToSrc = filename.substring(srcIndex + srcSegment.length);
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

        if (source.startsWith('@/')) {
          const importPath = source.substring(2);
          const aliasTargetModule = importPath.split('/')[0];

          // 跨模块用别名即合规，仅同模块需改回相对路径
          if (aliasTargetModule !== currentModule) {
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

        // 同级 ./ 必在模块内部，只需关注向上跨目录的 ../
        if (!source.startsWith('../')) {
          return;
        }

        const targetRelativeToSrc = path.posix.join(currentDir, source);

        // .. 开头说明逃出了 src，非 src 内引用
        if (targetRelativeToSrc.startsWith('..')) {
          return;
        }

        const relativeTargetModule = targetRelativeToSrc.split('/')[0];
        if (relativeTargetModule !== currentModule) {
          context.report({
            node: node.source,
            messageId: 'useAlias',
            data: {
              current: currentModule,
              target: relativeTargetModule,
              targetPath: targetRelativeToSrc,
            },
            fix(fixer) {
              return fixer.replaceText(node.source, `'@/${targetRelativeToSrc}'`);
            },
          });
        }
      },
    };
  },
};
