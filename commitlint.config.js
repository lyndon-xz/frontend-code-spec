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

    // 提交类型必须是小写
    'type-case': [2, 'always', 'lower-case'],

    // 提交类型不能为空
    'type-empty': [2, 'never'],

    // 限制提交信息头部（type + scope + subject）的最大长度
    'header-max-length': [2, 'always', 120],

    // 提交主题不能为空
    'subject-empty': [2, 'never'],

    // 提交信息正文前必须有空行
    'body-leading-blank': [2, 'always'],

    // 提交信息页脚前必须有空行
    'footer-leading-blank': [2, 'always'],
  },
};
