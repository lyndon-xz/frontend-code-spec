export default {
  extends: ['stylelint-config-standard-scss', 'stylelint-config-css-modules'],
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
    // 限制最大嵌套层级为 3 层
    'max-nesting-depth': [
      3,
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
};
