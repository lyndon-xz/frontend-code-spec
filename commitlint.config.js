/**
 * commitlint 配置：基于 Angular 提交规范校验 git 提交信息。
 * 格式为 `<type>(<scope>): <subject>`，如 `feat(user): 添加用户登录功能`。
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 提交类型枚举，只允许指定的类型
    'type-enum': [
      2,
      'always',
      [
        // 新功能
        'feat',
        // 修复 bug
        'fix',
        // 文档更新
        'docs',
        // 代码格式（不影响代码运行的变动）
        'style',
        // 重构（既不是新增功能，也不是修复 bug 的代码变动）
        'refactor',
        // 性能优化
        'perf',
        // 增加测试
        'test',
        // 构建过程或辅助工具的变动
        'chore',
        // 回滚
        'revert',
        // 构建系统或外部依赖的变动
        'build',
        // 持续集成相关的变动
        'ci',
      ],
    ],

    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],

    // 头部（type + scope + subject）最大长度
    'header-max-length': [2, 'always', 120],
  },
};
