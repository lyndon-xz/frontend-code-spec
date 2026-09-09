import { DEFAULT_SRC_DIR } from '../../utils/source-layout.js';
import { stripSourceExtension } from '../../utils/strip-source-extension.js';
import { toPosixPath } from '../../utils/to-posix-path.js';

// 这些目录下的 index 视为「禁止存在」的桶入口
const DEFAULT_PUBLIC_LIB_DIRS = ['constants', 'utils', 'types', 'hooks'];

// 选项默认值的唯一来源：schema 的 default 与 create 里的取值都引用此处
const DEFAULT_OPTIONS = {
  publicLibDirs: DEFAULT_PUBLIC_LIB_DIRS,
  srcDir: DEFAULT_SRC_DIR,
};

// 判据是「直接父目录为公共库目录且位于 src 内」，与层级深浅无关：src/apis/utils/index.ts 同样是桶
function analyzeIndexPath(filename, layout) {
  const segments = toPosixPath(filename).split('/');
  const basename = segments[segments.length - 1];
  const isIndex = stripSourceExtension(basename) === 'index';
  if (!isIndex) {
    return { isPublicLib: false };
  }

  const { publicLibDirs, srcDir } = layout;
  const srcIndex = segments.lastIndexOf(srcDir);
  const parentDir = segments[segments.length - 2];
  // srcIndex < segments.length - 2 保证 src 严格在父目录之上，排除 src/index.ts 自身
  const isPublicLib =
    srcIndex !== -1 && srcIndex < segments.length - 2 && publicLibDirs.includes(parentDir);

  return {
    isPublicLib,
    // 文案展示自 src 起的路径，深层公共库也能一眼定位
    srcRelativePath: isPublicLib ? segments.slice(srcIndex).join('/') : null,
  };
}

/** 公共库 index 禁文件存在（不看内容），其余文件禁转发导出；同一文件只落一档，不重复报错 */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        '禁止 barrel 入口：公共库 index 禁文件存在；任意文件禁桶导出（export *）与转发导出（export { x } from）',
    },
    schema: [
      {
        type: 'object',
        properties: {
          publicLibDirs: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            // 空数组会让公共库桶那一档静默失效
            minItems: 1,
            default: DEFAULT_OPTIONS.publicLibDirs,
          },
          srcDir: {
            type: 'string',
            minLength: 1,
            default: DEFAULT_OPTIONS.srcDir,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noPublicBarrel: '禁止公共库桶文件 `{{path}}`：请按领域文件直引，勿设 barrel',
      noBarrelStar: '禁止使用桶导出（export * from "..."）',
      noReexport: '禁止转发导出其他模块的内容，请让消费方直接 import 定义处',
    },
  },
  create(context) {
    const layout = { ...DEFAULT_OPTIONS, ...context.options[0] };
    const { isPublicLib, srcRelativePath } = analyzeIndexPath(context.filename, layout);

    if (isPublicLib) {
      return {
        Program(node) {
          context.report({ node, messageId: 'noPublicBarrel', data: { path: srcRelativePath } });
        },
      };
    }

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
