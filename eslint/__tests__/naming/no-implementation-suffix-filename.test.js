import tsparser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/naming/no-implementation-suffix-filename.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsparser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

// 规则只看文件名，不看代码内容，统一用一段无关代码
const CODE = 'const a = 1;';

ruleTester.run('no-implementation-suffix-filename', rule, {
  valid: [
    // 业务名词主导的文件名
    { code: CODE, filename: 'order-detail.tsx' },
    // index 入口文件放行
    { code: CODE, filename: 'index.ts' },
    // 分层结构文件名放行：store/model/types/constants/utils/config
    { code: CODE, filename: 'store.ts' },
    { code: CODE, filename: 'types.ts' },
    { code: CODE, filename: 'utils.ts' },
    { code: CODE, filename: 'config.ts' },
    // 业务集合视图 review-list 放行（-list 不在禁用后缀内）
    { code: CODE, filename: 'review-list.tsx' },
    // 测试文件豁免
    { code: CODE, filename: 'flight-modal.test.tsx' },
    // 类型声明文件豁免
    { code: CODE, filename: 'columns.d.ts' },
    // 配置文件豁免（.config.ts）
    { code: CODE, filename: 'form.config.ts' },
    // __tests__ 目录下豁免
    { code: CODE, filename: '/proj/__tests__/columns.ts' },
  ],
  invalid: [
    // UI 限定符后缀 -modal
    {
      code: CODE,
      filename: 'flight-modal.tsx',
      errors: [{ messageId: 'suffixForbidden', data: { suffix: '-modal' } }],
    },
    // UI 限定符后缀 -button
    {
      code: CODE,
      filename: 'submit-button.tsx',
      errors: [{ messageId: 'suffixForbidden', data: { suffix: '-button' } }],
    },
    // 技术类型后缀 -type
    {
      code: CODE,
      filename: 'order-type.ts',
      errors: [{ messageId: 'suffixForbidden', data: { suffix: '-type' } }],
    },
    // 技术类型后缀 -config（注意 config.ts 整名放行，但 xxx-config 禁用）
    {
      code: CODE,
      filename: 'table-config.ts',
      errors: [{ messageId: 'suffixForbidden', data: { suffix: '-config' } }],
    },
    // 技术类型后缀 -utils
    {
      code: CODE,
      filename: 'flight-utils.ts',
      errors: [{ messageId: 'suffixForbidden', data: { suffix: '-utils' } }],
    },
    // 纯实现整名 columns
    {
      code: CODE,
      filename: 'columns.tsx',
      errors: [{ messageId: 'exactForbidden', data: { name: 'columns' } }],
    },
    // 纯实现整名 form-config（EXACT 优先于 -config 后缀匹配）
    {
      code: CODE,
      filename: 'form-config.ts',
      errors: [{ messageId: 'exactForbidden', data: { name: 'form-config' } }],
    },
  ],
});
