export default {
  // recess-order 排在末位：它只提供 properties-order，放最后确保这份顺序不被前面的 config 覆盖
  extends: [
    'stylelint-config-standard-scss',
    'stylelint-config-css-modules',
    'stylelint-config-recess-order',
  ],
  rules: {
    // 强制 CSS 变量使用 kebab-case
    'custom-property-pattern': [
      '^([a-z][a-z0-9]*)(-[a-z0-9]+)*$',
      {
        message: 'Expected custom property name to be kebab-case',
      },
    ],
    // 强制使用 camelCase 作为 class 的命名规范（配合 CSS Modules）
    'selector-class-pattern': [
      '^[a-z][a-zA-Z0-9]+$',
      {
        message: 'Expected class selector to be camelCase, matching CSS Module rules.',
      },
    ],
    /*
     * 自定义属性按语义分组时中间会留空行（颜色一组、字体一组），不禁。
     * standard 的默认值 except: after-custom-property 只允许连续变量紧挨着写。
     */
    'custom-property-empty-line-before': null,
    /*
     * 字体族名是专有名词（Georgia、Inter），大小写不该被拉平；
     * 自定义属性的值 stylelint 判不出语义，一并跳过。
     */
    'value-keyword-case': ['lower', { ignoreProperties: ['font-family', 'font', '/^--/'] }],
    // 选择器最多 3 层：深度从 0 计，顶层规则之下最多再嵌套 2 层
    'max-nesting-depth': [
      2,
      {
        ignoreAtRules: ['each', 'media', 'supports', 'include'],
      },
    ],
    // 禁用未知的选择器和伪类（容忍 global）
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global', 'local', 'export'],
      },
    ],
    // 防御恶意的 z-index 层叠：只允许极小正负值或变量，强制统一收口
    'declaration-property-value-allowed-list': {
      'z-index': ['/var\\(/', '-1', '0', '1', '2', '3', '4', '5'],
    },
  },
  overrides: [
    {
      // 全局样式表用 kebab-case：类名不经 JS 引用，且覆盖 antd 时必须照抄它的类名
      files: ['**/global.scss', '**/globals.scss', '**/theme.scss', '**/*.global.scss'],
      rules: {
        'selector-class-pattern': [
          '^([a-z][a-z0-9]*)(-[a-z0-9]+)*$',
          {
            message: 'Expected class selector in global stylesheet to be kebab-case',
          },
        ],
      },
    },
  ],
};
