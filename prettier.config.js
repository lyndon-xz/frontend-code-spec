export default {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  /*
   * consistent 而非 as-needed：ESLint 规则对象里大多数键含斜杠或连字符、必须带引号，
   * as-needed 会让 eqeqeq 这类短名独独裸着，规则清单于是无法用「带引号的键」一次扫全。
   * consistent 让同一对象内要么全带引号、要么全不带，扫描与对账才可靠。
   */
  quoteProps: 'consistent',
  trailingComma: 'all',
  bracketSpacing: true,
  // 参数始终加括号，避免 TS 类型注解场景下的歧义
  arrowParens: 'always',
  endOfLine: 'lf',
};
