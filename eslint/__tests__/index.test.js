import { describe, expect, it } from 'vitest';

import config from '../index.js';

// 从扁平配置数组里取出注册了自研插件的那一项
const customPlugin = config.find((item) => item.plugins?.custom)?.plugins.custom;

describe('eslint flat config 入口', () => {
  it('默认导出为非空的扁平配置数组', () => {
    expect(Array.isArray(config)).toBe(true);
    expect(config.length).toBeGreaterThan(0);
  });

  it('在 custom 命名空间下注册了自研规则插件', () => {
    expect(customPlugin).toBeDefined();
    expect(customPlugin.rules).toBeTypeOf('object');
  });

  it('注册全部 19 条自研规则', () => {
    expect(Object.keys(customPlugin.rules)).toHaveLength(19);
  });

  it('每条规则都具备合法的 meta 与 create', () => {
    for (const [id, rule] of Object.entries(customPlugin.rules)) {
      expect(rule, id).toBeDefined();
      expect(rule.meta, id).toBeTypeOf('object');
      expect(rule.meta.messages, id).toBeTypeOf('object');
      expect(rule.create, id).toBeTypeOf('function');
    }
  });

  it('包含对 TS/TSX 文件生效的语言配置项', () => {
    const tsItem = config.find(
      (item) => Array.isArray(item.files) && item.files.includes('**/*.tsx'),
    );
    expect(tsItem).toBeDefined();
    expect(tsItem.languageOptions.parser).toBeDefined();
  });
});
