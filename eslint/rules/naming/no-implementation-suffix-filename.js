import path from 'path';

import { isExemptFile } from '../../utils/is-exempt-file.js';
import { stripSourceExtension } from '../../utils/strip-source-extension.js';

// 类型应由代码自身暴露，故文件名只体现功能领域；骨架文件（index / store / config 等）放行

// config 是分层约定的骨架文件名，放行；constants / types / utils 是形态整名，不豁免
const FORBIDDEN_EXACT_FILENAMES = new Set([
  'columns',
  'form-config',
  'utils',
  'helpers',
  'helper',
  'common',
  'misc',
  'io',
  'defaults',
  'types',
  'constants',
]);

// -list 不在其中：业务集合视图（review-list）用它表意
const IMPLEMENTATION_SUFFIX_PATTERN =
  /-(radio|button|modal|dialog|drawer|popup|tooltip|type|enum|config|constant|interface|util|utils)$/;

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        '文件名禁用实现类后缀（-modal/-type/-enum/-config/-util(s) 等）与纯实现整名（columns/utils/constants/types 等），强制业务名词主导。骨架文件 config / index 与业务集合名如 review-list 放行',
    },
    schema: [],
    messages: {
      exactForbidden:
        '文件名 `{{name}}` 是纯实现构造，请改用业务领域命名（如 order-detail、review-filter），类型由代码自身暴露',
      suffixForbidden:
        '文件名禁用实现类后缀 `{{suffix}}`，请用业务名词命名（如 flight-detail 而非 flight-modal），类型由代码自身暴露',
    },
  },
  create(context) {
    const { filename } = context;

    return {
      Program(node) {
        const nameWithoutExt = stripSourceExtension(path.basename(filename));

        if (nameWithoutExt === 'index' || isExemptFile(filename)) {
          return;
        }

        if (FORBIDDEN_EXACT_FILENAMES.has(nameWithoutExt)) {
          context.report({ node, messageId: 'exactForbidden', data: { name: nameWithoutExt } });
          return;
        }

        const suffixMatch = nameWithoutExt.match(IMPLEMENTATION_SUFFIX_PATTERN);
        if (suffixMatch) {
          context.report({ node, messageId: 'suffixForbidden', data: { suffix: suffixMatch[0] } });
        }
      },
    };
  },
};
