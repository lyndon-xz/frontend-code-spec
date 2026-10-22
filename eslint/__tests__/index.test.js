import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import plugin from '../index.js';
import { ruleDocsUrl } from '../utils/rule-docs-url.js';

const EXPECTED_RULE_NAMES = [
  'comment-style',
  'no-param-destructuring',
  'hoist-module-scope-destructuring',
  'require-unit-suffix',
  'no-handle-prefix',
  'no-generic-param-name',
  'ref-suffix-naming',
  'no-internal-on-prefix',
  'status-field-naming',
  'no-unnecessary-arrow-wrapper',
  'props-interface-naming',
  'import-path-boundary',
  'require-tsx-default-export',
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

  it('每条注册的规则都有 docs.url，且指向的规则文档存在', () => {
    const pluginEntry = plugin.find((item) => item.plugins?.custom);
    for (const [name, rule] of Object.entries(pluginEntry.plugins.custom.rules)) {
      expect(rule.meta.docs.url).toBe(ruleDocsUrl(name));
      expect(fs.existsSync(path.resolve(import.meta.dirname, '../docs/rules', `${name}.md`))).toBe(
        true,
      );
    }
  });

  it('包含领域配置块（含 rules 或 files 的配置对象）', () => {
    const configBlocks = plugin.filter((item) => item.rules || item.files);
    expect(configBlocks.length).toBeGreaterThan(0);
  });
});
