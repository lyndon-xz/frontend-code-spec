/**
 * commitlint 配置文件
 * 用于检查 git 提交信息是否符合 Angular 提交规范
 *
 * 提交信息格式：
 * <type>(<scope>): <subject>
 *
 * <body>
 *
 * <footer>
 *
 * 示例：
 * feat(user): 添加用户登录功能
 *
 * 实现了用户登录的核心逻辑
 *
 * Closes #123
 *
 * =================== 规则配置说明 ===================
 *
 * 规则格式：[错误级别, 条件, 规则值]
 *
 * 【错误级别】：
 * - 0: 禁用 (Disabled) - 不检查此规则
 * - 1: 警告 (Warning) - 显示警告但允许提交
 * - 2: 错误 (Error) - 显示错误并阻止提交
 *
 * 【条件参数】：
 * - 'always': 总是应用规则 / 必须满足条件
 * - 'never': 永远不应用规则 / 不允许满足条件
 *
 * 【规则值】：
 * - 字符串: 'lower-case', 'upper-case', 'camel-case' 等
 * - 数字: 最大长度、最小长度等
 * - 数组: 允许的枚举值
 * - 布尔值: true/false
 *
 * ====================================================
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
