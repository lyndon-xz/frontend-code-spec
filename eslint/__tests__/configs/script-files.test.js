import path from 'node:path';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../../..');
const eslint = new ESLint({ cwd: root });

const lint = async (code, filePath) => {
  const [result] = await eslint.lintText(code, { filePath });

  return result.messages;
};

const ruleIds = (messages) => messages.map((message) => message.ruleId);

const isError = (value) =>
  value === 'error' ||
  value === 2 ||
  (Array.isArray(value) && (value[0] === 'error' || value[0] === 2));

describe('js / jsx 生效范围', () => {
  it('jsx 走控制流、hooks、可访问性和多余箭头，不走类型规则', async () => {
    const messages = await lint(
      [
        "import { useState } from 'react';",
        'export function Card(ready, fn) {',
        '  if (ready)',
        '    useState(0);',
        '  return <img src="a.png" onClick={() => fn()} />;',
        '}',
        '',
      ].join('\n'),
      'src/components/card.jsx',
    );
    const ids = ruleIds(messages);

    expect(ids).toContain('curly');
    expect(ids).toContain('react-hooks/rules-of-hooks');
    expect(ids).toContain('jsx-a11y-x/alt-text');
    expect(ids).toContain('custom/no-unnecessary-arrow-wrapper');
    expect(ids).not.toContain('@typescript-eslint/naming-convention');
    expect(ids).not.toContain('custom/props-interface-naming');

    const config = await eslint.calculateConfigForFile('src/components/card.jsx');

    expect(config.rules['@typescript-eslint/naming-convention']).toBeUndefined();
    expect(config.rules['custom/props-interface-naming']).toBeUndefined();
    expect(isError(config.rules['@typescript-eslint/no-explicit-any'])).toBe(false);
  });

  it('src 下的 js 同样检查组件、文件名和模块边界', async () => {
    const component = await lint(
      'export function Card(fn) {\n  return <img src="a.png" onClick={() => fn()} />;\n}\n',
      'src/components/card.js',
    );
    const componentIds = ruleIds(component);

    expect(componentIds).toContain('jsx-a11y-x/alt-text');
    expect(componentIds).toContain('custom/no-unnecessary-arrow-wrapper');

    const blocked = await lint('export const price = 1;\n', 'src/utils/utils.js');

    expect(ruleIds(blocked)).toContain('check-file/filename-blocklist');

    const barrel = await lint('export const price = 1;\n', 'src/utils/index.js');

    expect(ruleIds(barrel)).toContain('check-file/no-index');

    const boundary = await lint("import { price } from '@/utils/price';\n", 'src/utils/tax.js');

    expect(ruleIds(boundary)).toContain('custom/import-path-boundary');
  });

  it('工具目录里的 js 不套文件名黑名单和可访问性', async () => {
    const messages = await lint('export const level = 1;\n', 'eslint/utils/error-level.js');
    const ids = ruleIds(messages);

    expect(ids).not.toContain('check-file/filename-blocklist');
    expect(ids).not.toContain('jsx-a11y-x/alt-text');
  });

  it('tsx 仍检查 props 接口名', async () => {
    const config = await eslint.calculateConfigForFile('src/components/flight-card/index.tsx');

    expect(isError(config.rules['custom/props-interface-naming'])).toBe(true);
    expect(isError(config.rules['@typescript-eslint/naming-convention'])).toBe(true);
  });
});
