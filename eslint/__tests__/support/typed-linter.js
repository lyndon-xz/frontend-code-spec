import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';

const TSCONFIG = {
  compilerOptions: {
    strict: true,
    jsx: 'react-jsx',
    module: 'ESNext',
    moduleResolution: 'bundler',
    target: 'ESNext',
    skipLibCheck: true,
  },
  include: ['**/*.ts', '**/*.tsx'],
};

/**
 * 给需要类型信息的规则（如 naming-convention 的 types 过滤）跑配置级测试。
 * projectService 只认磁盘上的文件，所以每个用例都写到临时目录再 lint；
 * 同一文件名会命中 projectService 缓存的旧内容，调用方要给每个用例不同的 filename。
 * 调用方在 afterAll 里调用 cleanup 删除临时目录。
 */
export function createTypedLinter() {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fcs-typed-'));
  fs.writeFileSync(path.join(rootDir, 'tsconfig.json'), JSON.stringify(TSCONFIG));
  const linter = new Linter({ configType: 'flat', cwd: rootDir });

  return {
    lint(code, options) {
      const { filename, config } = options;
      const absolutePath = path.join(rootDir, filename);
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, code);
      return linter.verify(
        code,
        [
          {
            files: ['**/*.ts', '**/*.tsx'],
            languageOptions: {
              parser: tseslint.parser,
              parserOptions: { projectService: true, tsconfigRootDir: rootDir },
            },
          },
          ...config,
        ],
        { filename: absolutePath },
      );
    },
    cleanup() {
      fs.rmSync(rootDir, { recursive: true, force: true });
    },
  };
}
