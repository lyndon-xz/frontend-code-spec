import { normalizePath } from '../../utils/normalize-path.js';

// 公共库目录：这些目录下的 index 视为「禁止存在」的桶入口
const DEFAULT_PUBLIC_LIB_DIRS = ['constants', 'utils', 'types', 'hooks'];

/*
 * 解析文件路径，判定它是不是 index 文件、是不是公共库 index。
 * 公共库 index 命中 src/{publicLibDirs}/index.*（严格一层，深层路径不算）。
 */
function analyzeIndexPath(filename, publicLibDirs) {
  if (!filename) return { isIndex: false, isPublicLib: false };

  const parts = normalizePath(filename).split('/');
  const basename = parts[parts.length - 1];
  const isIndex = basename.replace(/\.(tsx?|jsx?)$/, '') === 'index';
  if (!isIndex) return { isIndex: false, isPublicLib: false };

  const srcIdx = parts.lastIndexOf('src');
  const isPublicLib =
    srcIdx !== -1 && parts.length === srcIdx + 3 && publicLibDirs.has(parts[srcIdx + 1]);

  return {
    isIndex: true,
    isPublicLib,
    libDir: isPublicLib ? parts[srcIdx + 1] : null,
    file: basename,
  };
}

/**
 * 禁止 barrel（桶）入口，按路径分两档策略，同一文件只落其中一档，不会重复报错：
 * - 公共库 index（src/{constants,utils,types,hooks}/index.*）→ 直接禁文件存在（不看内容），
 *   公共库必须按领域文件直引，连手写聚合入口都不许有。
 * - 其它任意 index.ts(x) → 只禁 re-export 桶：`export * from` 与带 source 的 `export { x } from`，
 *   index 仍可包含自身声明，只是不许当转发中枢。
 *
 * publicLibDirs 可通过 options 覆盖，业务目录约定不写死在规则里。
 */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        '禁止 barrel 入口：公共库 index 禁文件存在，其余 index 禁桶导出（export *）与跨模块重导出（export { x } from）',
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          publicLibDirs: {
            type: 'array',
            items: { type: 'string' },
            default: DEFAULT_PUBLIC_LIB_DIRS,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noPublicBarrel: '禁止公共库桶文件 `src/{{libDir}}/{{file}}`：请按领域文件直引，勿设 barrel',
      noBarrelStar: '禁止使用桶导出（export * from "..."）',
      noReexport: '禁止在 index.ts 中重导出其他模块的内容',
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const publicLibDirs = new Set(options.publicLibDirs ?? DEFAULT_PUBLIC_LIB_DIRS);

    const { isIndex, isPublicLib, libDir, file } = analyzeIndexPath(
      context.filename,
      publicLibDirs,
    );

    // 非 index 文件不受本规则约束
    if (!isIndex) return {};

    // 公共库 index：禁文件存在，报在 Program 上（不再检查 re-export，天然无双报）
    if (isPublicLib) {
      return {
        Program(node) {
          context.report({ node, messageId: 'noPublicBarrel', data: { libDir, file } });
        },
      };
    }

    // 其它 index：仅禁 re-export 桶
    return {
      ExportAllDeclaration(node) {
        context.report({ node, messageId: 'noBarrelStar' });
      },
      ExportNamedDeclaration(node) {
        if (node.source) {
          context.report({ node, messageId: 'noReexport' });
        }
      },
    };
  },
};
