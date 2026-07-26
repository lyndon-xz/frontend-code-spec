import { isExemptFile } from '../../utils/is-exempt-file.js';
import { normalizePath } from '../../utils/normalize-path.js';

/*
 * 叶子组件目录禁止拆出 constants / utils / types 旁路文件。
 * 仅本组件消费的常量/工具/类型应内联进 index.tsx，或上提到模块级。
 */
const FORBIDDEN = new Set(['constants', 'utils', 'types']);

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        '禁止 components/<name>/ 下出现 constants.ts / utils.ts / types.ts，旁路文件应内联或上提模块级',
    },
    fixable: null,
    schema: [],
    messages: {
      noSidecar:
        '组件目录禁止旁路文件 `{{basename}}.{{ext}}`：请内联进 index.tsx，或上提到模块级 constants/utils/types',
    },
  },
  create(context) {
    const { filename } = context;

    return {
      Program(node) {
        if (!filename || isExemptFile(filename)) return;

        // 匹配 .../components/<name>/<sidecar>.ts(x)
        const match = normalizePath(filename).match(/\/components\/[^/]+\/([^/]+)\.(tsx?|jsx?)$/);
        if (!match) return;

        const basename = match[1];
        if (!FORBIDDEN.has(basename)) return;

        context.report({ node, messageId: 'noSidecar', data: { basename, ext: match[2] } });
      },
    };
  },
};
