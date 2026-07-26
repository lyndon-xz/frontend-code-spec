import tsparser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/structure/import-path-boundary.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsparser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('import-path-boundary', rule, {
  valid: [
    // 跨模块引用使用 @/ 别名 —— 合规
    {
      code: "import x from '@/utils/bar';",
      filename: 'project/src/apis/foo.ts',
    },
    // 同目录相对引用 ./ —— 合规
    {
      code: "import x from './baz';",
      filename: 'project/src/apis/foo.ts',
    },
    // 第三方裸导入不受约束
    {
      code: "import React from 'react';",
      filename: 'project/src/apis/foo.ts',
    },
    // 模块内向上相对引用（同模块 ../）—— 合规
    {
      code: "import x from '../bar';",
      filename: 'project/src/apis/sub/foo.ts',
    },
    // 文件不在 src 下 —— 规则不生效
    {
      code: "import x from '@/apis/bar';",
      filename: 'project/lib/foo.ts',
    },
    // ../ 逃出 src 之外，非 src 内引用 —— 跳过
    {
      code: "import x from '../outside';",
      filename: 'project/src/foo.ts',
    },
    // 自定义 srcDir 下的跨模块别名 —— 合规
    {
      code: "import x from '@/utils/bar';",
      filename: 'project/app/apis/foo.ts',
      options: [{ srcDir: 'app' }],
    },
  ],
  invalid: [
    {
      // 同模块却用 @/ 别名，应改为相对路径
      code: "import x from '@/apis/bar';",
      filename: 'project/src/apis/foo.ts',
      output: "import x from './bar';",
      errors: [{ messageId: 'useRelative' }],
    },
    {
      // 跨模块却用 ../ 相对路径，应改为 @/ 别名
      code: "import x from '../utils/bar';",
      filename: 'project/src/apis/foo.ts',
      output: "import x from '@/utils/bar';",
      errors: [{ messageId: 'useAlias' }],
    },
    {
      // 自定义 srcDir，同模块别名同样报错
      code: "import x from '@/apis/bar';",
      filename: 'project/app/apis/foo.ts',
      options: [{ srcDir: 'app' }],
      output: "import x from './bar';",
      errors: [{ messageId: 'useRelative' }],
    },
    {
      // 同模块但被引文件在父级目录，修复结果已以 '.' 开头（跳过补 './' 分支）
      code: "import x from '@/apis/bar';",
      filename: 'project/src/apis/sub/foo.ts',
      output: "import x from '../bar';",
      errors: [{ messageId: 'useRelative' }],
    },
  ],
});
