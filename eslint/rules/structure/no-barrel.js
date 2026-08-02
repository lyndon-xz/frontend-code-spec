import { normalizePath } from '../../utils/normalize-path.js';
import { DEFAULT_SRC_DIR } from '../../utils/source-layout.js';

// 公共库目录：这些目录下的 index 视为「禁止存在」的桶入口
const DEFAULT_PUBLIC_LIB_DIRS = ['constants', 'utils', 'types', 'hooks'];

// 选项默认值的唯一来源：schema 的 default 与 create 里的取值都引用此处
const DEFAULT_OPTIONS = {
  publicLibDirs: DEFAULT_PUBLIC_LIB_DIRS,
  srcDir: DEFAULT_SRC_DIR,
};

/*
 * 解析文件路径，判定它是不是 index 文件、是不是公共库 index。
 * 公共库 index 的判据是「直接父目录为公共库目录且位于 src 内」，与层级深浅无关：
 * src/utils/index.ts 与 src/apis/utils/index.ts 同为公共库桶，都要禁。
 */
function analyzeIndexPath(filename, layout) {
  const { publicLibDirs, srcDir } = layout;
  const parts = normalizePath(filename).split('/');
  const basename = parts[parts.length - 1];
  const isIndex = basename.replace(/\.(tsx?|jsx?)$/, '') === 'index';
  if (!isIndex) return { isIndex: false, isPublicLib: false };

  const srcIdx = parts.lastIndexOf(srcDir);
  const parentDir = parts[parts.length - 2];
  // srcIdx < parts.length - 2 保证 src 严格在父目录之上，排除 src/index.ts 自身
  const isPublicLib =
    srcIdx !== -1 && srcIdx < parts.length - 2 && publicLibDirs.includes(parentDir);

  return {
    isIndex: true,
    isPublicLib,
    // 报错文案展示自 src 起的路径，深层公共库（apis/utils）也能一眼定位
    path: isPublicLib ? parts.slice(srcIdx).join('/') : null,
  };
}

/**
 * 禁止 barrel（桶）入口，按路径分两档策略，同一文件只落其中一档，不会重复报错：
 * - 公共库 index（父目录为 constants/utils/types/hooks 的 index.*）→ 直接禁文件存在（不看内容），
 *   公共库必须按领域文件直引，连手写聚合入口都不许有。
 * - 其它任意 index.ts(x) → 只禁 re-export 桶：`export * from` 与带 source 的 `export { x } from`，
 *   index 仍可包含自身声明，只是不许当转发中枢。
 *
 * publicLibDirs 与 srcDir 可通过 options 覆盖，业务目录约定不写死在规则里。
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
            default: DEFAULT_OPTIONS.publicLibDirs,
          },
          srcDir: {
            type: 'string',
            default: DEFAULT_OPTIONS.srcDir,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noPublicBarrel: '禁止公共库桶文件 `{{path}}`：请按领域文件直引，勿设 barrel',
      noBarrelStar: '禁止使用桶导出（export * from "..."）',
      noReexport: '禁止在 index.ts 中重导出其他模块的内容',
    },
  },
  create(context) {
    const layout = { ...DEFAULT_OPTIONS, ...context.options[0] };
    const { isIndex, isPublicLib, path } = analyzeIndexPath(context.filename, layout);

    if (!isIndex) return {};

    // 公共库 index：禁文件存在，报在 Program 上（不检查 re-export，天然无双报）
    if (isPublicLib) {
      return {
        Program(node) {
          context.report({ node, messageId: 'noPublicBarrel', data: { path } });
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
