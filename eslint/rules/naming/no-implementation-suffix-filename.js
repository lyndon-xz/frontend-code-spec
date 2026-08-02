import path from 'path';

import { isExemptFile } from '../../utils/is-exempt-file.js';

/*
 * 文件名禁用实现类后缀，强制业务名词主导。禁用后缀：
 * - UI 限定符：-radio / -button / -modal / -dialog / -drawer / -popup / -tooltip
 * - 技术类型：-type / -enum / -config / -constant / -interface / -util(s)
 * - 纯实现构造整名：columns / form-config
 * 放行：规范分层结构文件名（index/store/model/actions/effects/slice/reducer/types/constants/utils/hooks/config 等）
 * 与业务集合名（如 review-list：某领域集合视图，非 UI 控件种类）。类型应由代码自身暴露，文件名体现功能领域。
 */

// 连字符结尾的实现后缀（匹配 xxx-modal.tsx 中的 -modal）。-list 不在其中：业务集合视图（review-list）用它表意。
const SUFFIX_PATTERN =
  /-(radio|button|modal|dialog|drawer|popup|tooltip|type|enum|config|constant|interface|util|utils)$/;

// 整名即为纯实现构造（不含领域语义）。仅这两个：其余如 constants/types/config 是分层约定的结构文件名，放行。
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
    /*
     * ESLint 9 flat config 下 context.filename 恒为非空字符串（未提供文件名时为 `<input>`），
     * 故全规则集统一不设空值守卫，也不再兜底旧版 getFilename()。
     */
    const { filename } = context;

    return {
      Program(node) {
        const basename = path.basename(filename);
        // 去掉扩展名（.ts/.tsx/.d.ts）
        const nameWithoutExt = basename.replace(/\.(d\.ts|tsx?|jsx?)$/, '');

        // 放行 index，以及测试 / 类型声明 / mock / 配置等豁免文件
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
