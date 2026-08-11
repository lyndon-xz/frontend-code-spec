import path from 'path';

import { isExemptFile } from '../../utils/is-exempt-file.js';

// 类型应由代码自身暴露，故文件名只体现功能领域；分层结构文件名（index / store / types 等）放行

// -list 不在其中：业务集合视图（review-list）用它表意
const SUFFIX_PATTERN =
  /-(radio|button|modal|dialog|drawer|popup|tooltip|type|enum|config|constant|interface|util|utils)$/;

// 仅这两个整名不含领域语义；constants / types / config 是分层约定的结构文件名，放行
const EXACT_FORBIDDEN = new Set(['columns', 'form-config']);

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        '文件名禁用实现类后缀（-modal/-type/-enum/-config/-util(s) 等）与纯实现整名（columns/form-config），强制业务名词主导。业务集合名如 review-list 放行',
    },
    fixable: null,
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
        const basename = path.basename(filename);
        const nameWithoutExt = basename.replace(/\.(d\.ts|tsx?|jsx?)$/, '');

        if (nameWithoutExt === 'index' || isExemptFile(filename)) {
          return;
        }

        if (EXACT_FORBIDDEN.has(nameWithoutExt)) {
          context.report({ node, messageId: 'exactForbidden', data: { name: nameWithoutExt } });
          return;
        }

        const suffixMatch = nameWithoutExt.match(SUFFIX_PATTERN);
        if (suffixMatch) {
          context.report({ node, messageId: 'suffixForbidden', data: { suffix: suffixMatch[0] } });
        }
      },
    };
  },
};
