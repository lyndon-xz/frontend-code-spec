import checkFile from 'eslint-plugin-check-file';

import { EXEMPT_GLOBS } from '../utils/is-exempt-file.js';
import { SRC_FILE_GLOBS } from '../utils/source-layout.js';

const BOOLEAN_PREFIXES = ['is', 'should', 'has', 'can', 'did', 'will'];

// custom 作用于剥掉前缀之后的名字：isNotReady 剩 NotReady 会命中，hasNotification 剩 Notification 不会
const NOT_PREFIX = { regex: '^Not[A-Z]', match: false };

// 集合名用复数表意，类型后缀只复述类型
const COLLECTION_SUFFIX = { regex: '(Array|List)$', match: false };

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]|Interface$',
            match: false,
          },
        },
        {
          // 解构出的变量不校验布尔前缀，常来自外部接口
          selector: 'variable',
          modifiers: ['destructured'],
          types: ['boolean'],
          format: null,
        },
        {
          selector: 'variable',
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: BOOLEAN_PREFIXES,
          custom: NOT_PREFIX,
        },
        {
          // variable 选择器不覆盖类型字段，字段才是跨模块传递的契约
          selector: 'typeProperty',
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: BOOLEAN_PREFIXES,
          custom: NOT_PREFIX,
        },
        {
          // 解构出的参数与解构出的变量同理，名字由调用方的对象决定
          selector: 'parameter',
          modifiers: ['destructured'],
          types: ['boolean'],
          format: null,
        },
        {
          selector: 'parameter',
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: BOOLEAN_PREFIXES,
          custom: NOT_PREFIX,
        },
        {
          selector: 'classProperty',
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: BOOLEAN_PREFIXES,
          custom: NOT_PREFIX,
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
        {
          selector: 'enumMember',
          format: ['PascalCase'],
        },
        {
          // 单字母是 TS 惯例；多字母仍要 T 前缀
          selector: 'typeParameter',
          format: ['PascalCase'],
          custom: {
            regex: '^([A-Z]|T[A-Z][a-zA-Z0-9]*)$',
            match: true,
          },
        },
        {
          // 不禁 Type 后缀：业务里多半是领域词（RoomType）
          selector: 'typeAlias',
          format: ['PascalCase'],
          custom: {
            regex: '(Interface|Alias)$',
            match: false,
          },
        },
        {
          selector: 'variable',
          types: ['array'],
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          custom: COLLECTION_SUFFIX,
        },
        {
          selector: 'typeProperty',
          types: ['array'],
          format: null,
          custom: COLLECTION_SUFFIX,
        },
        {
          selector: 'class',
          modifiers: ['abstract'],
          format: ['PascalCase'],
          custom: {
            regex: '^Abstract',
            match: true,
          },
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
          custom: {
            regex: 'Async$',
            match: false,
          },
        },
        {
          // 只补 Async 后缀约束，不给函数常量引入大小写要求
          selector: 'variable',
          types: ['function'],
          format: null,
          custom: {
            regex: 'Async$',
            match: false,
          },
        },
        {
          selector: ['classMethod', 'objectLiteralMethod', 'typeMethod'],
          format: null,
          custom: {
            regex: 'Async$',
            match: false,
          },
        },
      ],
    },
  },
  {
    // 哪些文件豁免由规则内 isExemptFile 判定
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    rules: {
      'custom/no-handle-prefix': 'error',
      'custom/no-generic-param-name': 'error',
      'custom/no-internal-on-prefix': 'error',
    },
  },
  {
    // 依赖 React API 或业务文件命名约定，只对 src 源码成立
    files: SRC_FILE_GLOBS,
    rules: {
      'custom/ref-suffix-naming': 'error',
      'custom/status-field-naming': 'error',
      'custom/require-unit-suffix': 'error',
    },
  },
  {
    /*
     * 文件名只体现功能领域，类型由代码自身暴露。骨架文件名 index / store / config 不在其列；
     * -list 也不算实现后缀，业务集合视图（review-list）用它表意。
     */
    files: SRC_FILE_GLOBS,
    ignores: EXEMPT_GLOBS,
    plugins: {
      'check-file': checkFile,
    },
    rules: {
      'check-file/filename-blocklist': [
        'error',
        {
          '**/{columns,form-config,utils,helpers,helper,common,misc,io,defaults,types,constants}.{ts,tsx}':
            '<业务领域名>.ts',
          '**/*-{radio,button,modal,dialog,drawer,popup,tooltip,type,enum,config,constant,interface,util,utils}.{ts,tsx}':
            '<业务领域名>.ts',
        },
        {
          errorMessage:
            '文件名 `{{ target }}` 是实现类后缀或形态整名，请改用业务领域命名（如 flight-detail 而非 flight-modal），类型由代码自身暴露',
        },
      ],
    },
  },
];
