/** 命名约束 — naming-convention + 自研命名规则 */
export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          // 接口禁 I 前缀（如 IUser）
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: false,
          },
        },
        {
          // 解构出的变量不校验布尔前缀，它们常来自外部接口 / 库
          selector: 'variable',
          modifiers: ['destructured'],
          types: ['boolean'],
          format: null,
        },
        {
          selector: 'variable',
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: ['is', 'should', 'has', 'can', 'did', 'will'],
        },
        {
          /*
           * 上面的 variable 选择器只覆盖变量，接口与类型别名的字段不在其列，
           * 而它们才是跨模块传递的契约，同样要读作判断短语。
           */
          selector: 'typeProperty',
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: ['is', 'should', 'has', 'can', 'did', 'will'],
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
        {
          /*
           * 放行单个大写字母（T / K / V）与 T 前缀的描述性名字：单字母是 TS 社区惯例，
           * 且不可能与具体类型混淆；多字母时仍要 T 前缀，避免与具体类型同形。
           */
          selector: 'typeParameter',
          format: ['PascalCase'],
          custom: {
            regex: '^([A-Z]|T[A-Z][a-zA-Z0-9]*)$',
            match: true,
          },
        },
        {
          /*
           * Interface / Alias 描述的是「这是个类型」，读者从声明处已经知道。不禁 Type 后缀——
           * 它在业务里多半是领域词（RoomType、PaymentType），正则区分不了领域词与冗余命名。
           */
          selector: 'typeAlias',
          format: ['PascalCase'],
          custom: {
            regex: '(Interface|Alias)$',
            match: false,
          },
        },
        {
          // 数组禁 Array 类型后缀，List 作领域集合名放行
          selector: 'variable',
          types: ['array'],
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          custom: {
            regex: 'Array$',
            match: false,
          },
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
      ],
    },
  },
  {
    /*
     * 与框架、目录分层都无关的命名约定，仓库内所有代码一律适用。
     * 哪些文件豁免由规则内的 isExemptFile 判定（唯一来源）：会被测试桩倒逼命名的规则自行豁免。
     */
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    rules: {
      'custom/no-handle-prefix': 'error',
      // 参数禁泛化命名，默认 data / callback，可通过 bannedNames 扩展
      'custom/no-generic-param-name': 'error',
      // on 前缀仅用于 Props 回调，内部函数禁用
      'custom/no-internal-on-prefix': 'error',
    },
  },
  {
    // 依赖 React API、状态范式或业务文件命名约定，只对 src 源码成立
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      // useRef 变量必须以 Ref 结尾
      'custom/ref-suffix-naming': 'error',
      // 文件名禁实现类后缀（-modal/-type/-config 等）与纯实现整名（columns/form-config），业务集合名如 review-list 放行
      'custom/no-implementation-suffix-filename': 'error',
      // 数据 / 异步状态字段强制后缀式命名（isLoadingXxx / xxxError）
      'custom/status-field-naming': 'error',
      /*
       * 类型成员中的数值量纲字段必须带单位后缀（priceCents / timeoutMs）。
       * 不豁免测试：桩数据里的字段同样来自契约，单位写错的桩会把错误的预期固化下来。
       */
      'custom/require-unit-suffix': 'error',
    },
  },
];
