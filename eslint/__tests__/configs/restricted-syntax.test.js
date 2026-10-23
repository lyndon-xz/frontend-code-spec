import js from '@eslint/js';
import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

import controlFlowConfig from '../../configs/control-flow.js';
import restrictedSyntaxConfig from '../../configs/restricted-syntax.js';

const linter = new Linter({ configType: 'flat' });

// 与 eslint.config.js 同序：recommended 的 no-empty 在前，control-flow 的放行空 catch 在后
const config = [
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  ...controlFlowConfig,
  ...restrictedSyntaxConfig,
];

const lint = (code, filename) => linter.verify(code, config, { filename });

const restrictedMessages = (code, filename) =>
  lint(code, filename).filter((message) => message.ruleId === 'no-restricted-syntax');

const withCatch = (body) => `const run = () => 1;\ntry {\n  run();\n} catch {\n${body}\n}\n`;

describe('restricted-syntax：catch 处置', () => {
  it('完全空的 catch 只报一条，且来自 no-restricted-syntax', () => {
    const messages = lint(withCatch(''), 'eslint/a.js');

    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe('no-restricted-syntax');
    expect(messages[0].message).toContain('空 catch');
  });

  it('只有注释的 catch 按空 catch 报', () => {
    const messages = restrictedMessages(withCatch('  // 忽略'), 'src/a.ts');

    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain('空 catch');
  });

  it('只有 console 调用的 catch 报只打日志', () => {
    const code = withCatch("  console.error('失败');\n  console.warn('再试');");
    const messages = restrictedMessages(code, 'eslint/b.js');

    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain('只打日志');
  });

  it('打日志之外还有处置时不报', () => {
    const code = withCatch("  console.error('失败');\n  throw new Error('失败');");

    expect(restrictedMessages(code, 'src/b.ts')).toEqual([]);
  });

  it('交给处置函数时不报', () => {
    const code = `const report = () => 1;\n${withCatch('  report();')}`;

    expect(restrictedMessages(code, 'eslint/c.js')).toEqual([]);
  });
});

describe('restricted-syntax：persist 白名单', () => {
  const persistCall = (options) =>
    `const persist = (creator, options) => [creator, options];\nexport const store = persist(() => ({}), ${options});\n`;

  it('persist 的配置对象缺少 partialize 与 whitelist 时报', () => {
    const messages = restrictedMessages(persistCall("{ name: 'hotel' }"), 'src/store/a.ts');

    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain('partialize');
  });

  it('带 partialize 或 whitelist 时不报', () => {
    const partialize = persistCall("{ name: 'hotel', partialize: (state) => state }");
    const whitelist = persistCall("{ name: 'hotel', whitelist: ['city'] }");

    expect(restrictedMessages(partialize, 'src/store/b.ts')).toEqual([]);
    expect(restrictedMessages(whitelist, 'src/store/c.ts')).toEqual([]);
  });

  it('src 下的 js 与 jsx 也报，工具目录里的 js 不报', () => {
    const code = persistCall("{ name: 'hotel' }");

    expect(restrictedMessages(code, 'src/store/a.js')).toHaveLength(1);
    expect(restrictedMessages(code, 'src/store/a.jsx')).toHaveLength(1);
    expect(restrictedMessages(code, 'eslint/d.js')).toEqual([]);
  });
});

describe('restricted-syntax：try 包 JSX', () => {
  it('try 块直接 return JSX 元素或 Fragment 时报', () => {
    const element =
      'export const A = () => {\n  try {\n    return <div />;\n  } catch {\n    throw new Error("x");\n  }\n};\n';
    const fragment = element.replace('<div />', '<></>');

    expect(restrictedMessages(element, 'src/components/a/index.tsx')[0].message).toContain(
      'Error Boundary',
    );
    expect(restrictedMessages(fragment, 'src/components/b/index.tsx')).toHaveLength(1);
    expect(restrictedMessages(element, 'src/components/a/index.jsx')).toHaveLength(1);
    expect(restrictedMessages(element, 'src/components/a/index.js')).toHaveLength(1);
  });

  it('try 块返回普通值时不报', () => {
    const code =
      'export const read = () => {\n  try {\n    return JSON.parse("1");\n  } catch {\n    throw new Error("x");\n  }\n};\n';

    expect(restrictedMessages(code, 'src/components/c/index.tsx')).toEqual([]);
  });
});

describe('restricted-syntax：硬编码内网地址', () => {
  const hosts = [
    "export const a = 'http://localhost:3000';",
    "export const b = 'http://127.0.0.1:8080';",
    'export const port = 1;\nexport const c = `http://192.168.1.2:${port}`;',
    "export const d = 'https://10.0.0.1/api';",
  ];

  it('src 业务文件里的 localhost、回环、局域网与 10 网段地址都报', () => {
    hosts.forEach((code, index) => {
      const messages = restrictedMessages(code, `src/utils/host-${index}.ts`);

      expect(messages).toHaveLength(1);
      expect(messages[0].message).toContain('内网与本机地址');
    });
  });

  it('公网地址与路径中间的 10. 不报', () => {
    const code =
      "export const a = 'https://api.example.com';\nexport const b = 'https://a.com/10.0';";

    expect(restrictedMessages(code, 'src/utils/public-host.ts')).toEqual([]);
  });

  it('地址来源文件、测试文件与 src 之外的文件不报', () => {
    const code = hosts[0];

    expect(restrictedMessages(code, 'src/apis/constants/host.ts')).toEqual([]);
    expect(restrictedMessages(code, 'src/utils/environment.ts')).toEqual([]);
    expect(restrictedMessages(code, 'src/apis/__tests__/host.test.ts')).toEqual([]);
    expect(restrictedMessages(code, 'scripts/host.ts')).toEqual([]);
  });
});
