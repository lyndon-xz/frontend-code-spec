import { describe, expect, it } from 'vitest';

import plugin from '../index.js';

// 自研规则清单，与 index.js 注册的 custom 命名空间应一一对应
const EXPECTED_RULE_NAMES = [
  'comment-style',
  'no-promise-chain',
  'no-param-destructuring',
  'hoist-module-scope-destructuring',
  'require-unit-suffix',
  'require-enum-initializer',
  'no-handle-prefix',
  'no-generic-param-name',
  'ref-suffix-naming',
  'no-internal-on-prefix',
  'no-implementation-suffix-filename',
  'status-field-naming',
  'no-unnecessary-arrow-wrapper',
  'props-interface-naming',
  'import-path-boundary',
  'no-barrel',
  'require-tsx-default-export',
  'no-ts-default-export',
];

describe('eslint 插件装配', () => {
  it('默认导出为扁平配置数组', () => {
    expect(Array.isArray(plugin)).toBe(true);
    expect(plugin.length).toBeGreaterThan(0);
  });

  it('注册了 custom 命名空间下的全部自研规则', () => {
    const pluginEntry = plugin.find((item) => item.plugins?.custom);
    expect(pluginEntry).toBeDefined();

    const registered = Object.keys(pluginEntry.plugins.custom.rules);
    expect(registered).toEqual(expect.arrayContaining(EXPECTED_RULE_NAMES));
    expect(registered).toHaveLength(EXPECTED_RULE_NAMES.length);
  });

  it('每条注册的规则都具备 meta 与 create', () => {
    const pluginEntry = plugin.find((item) => item.plugins?.custom);
    for (const rule of Object.values(pluginEntry.plugins.custom.rules)) {
      expect(rule).toHaveProperty('meta');
      expect(typeof rule.create).toBe('function');
    }
  });

  it('包含领域配置块（含 rules 或 files 的配置对象）', () => {
    const configBlocks = plugin.filter((item) => item.rules || item.files);
    expect(configBlocks.length).toBeGreaterThan(0);
  });
});
