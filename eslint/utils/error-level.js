const promote = (level) => (level === 'warn' || level === 1 ? 'error' : level);

/** 预设里的 warn 不会让 CI 失败；本仓规则只有一档，展开社区预设时统一升为 error，off 与选项原样保留 */
export function toErrorLevel(rules) {
  return Object.fromEntries(
    Object.entries(rules).map((entry) => {
      const [name, setting] = entry;

      if (Array.isArray(setting)) {
        const [level, ...options] = setting;

        return [name, [promote(level), ...options]];
      }
      return [name, promote(setting)];
    }),
  );
}
