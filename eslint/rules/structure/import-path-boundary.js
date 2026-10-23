import path from 'node:path';

import { DEFAULT_SRC_DIR } from '../../constants/source-globs.js';
import { isExemptFile, toPosixPath } from '../../utils/is-exempt-file.js';

// 选项默认值的唯一来源：schema 的 default 与 create 里的取值都引用此处
const DEFAULT_OPTIONS = {
  srcDir: DEFAULT_SRC_DIR,
  containerDirs: ['pages'],
};

/*
 * 容器目录下的每个子目录各算一个模块（pages/search 与 pages/detail 互为跨模块），其余目录以第一段为模块。
 * 入参是目录或导入目标路径：导入目标的末段可能是目录（@/pages/detail），所以按目录看待。
 */
function toModuleKey(pathRelativeToSrc, containerDirs) {
  const segments = pathRelativeToSrc.split('/');
  if (containerDirs.includes(segments[0]) && segments.length > 1) {
    return `${segments[0]}/${segments[1]}`;
  }
  return segments[0];
}

/** 只改写 import 源字符串，与只调语句顺序的 import/order 正交 */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        '同一模块用相对路径，跨模块用 @/。模块是 src 下第一级目录；pages 下每个子目录各算一个模块',
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
          containerDirs: {
            type: 'array',
            items: { type: 'string', minLength: 1, pattern: '^[^/\\\\]+$' },
            uniqueItems: true,
            default: DEFAULT_OPTIONS.containerDirs,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      useRelative:
        '同一模块内请用相对路径。模块是 src 下第一级目录；pages 下每个子目录各算一个模块（当前是 {{module}}/）',
      useAlias:
        '跨模块请用 @/ 别名。模块是 src 下第一级目录；pages 下每个子目录各算一个模块（从 {{current}}/ 到 {{target}}/），如：@/{{targetPath}}',
    },
  },
  create(context) {
    const { srcDir, containerDirs } = { ...DEFAULT_OPTIONS, ...context.options[0] };

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
    // 顶层文件时为 '.'
    const currentDir = path.posix.dirname(relativeToSrc);
    const currentModule = toModuleKey(currentDir, containerDirs);

    return {
      ImportDeclaration(node) {
        const source = node.source.value;

        // 只管仓库内引用；裸包名（react、@scope/pkg）不在本规则约束范围
        if (!source.startsWith('@/') && !source.startsWith('../') && !source.startsWith('./')) {
          return;
        }

        if (source.startsWith('@/')) {
          const importPath = source.substring(2);
          const aliasTargetModule = toModuleKey(importPath, containerDirs);

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

        const relativeTargetModule = toModuleKey(targetRelativeToSrc, containerDirs);
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
