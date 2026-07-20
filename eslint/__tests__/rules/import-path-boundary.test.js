import tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/import-path-boundary.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

const APIS_FILE = '/project/src/apis/services/flight.ts';

ruleTester.run('import-path-boundary', rule, {
  valid: [
    {
      name: '同级相对路径导入被放行',
      filename: APIS_FILE,
      code: "import { x } from './order';",
    },
    {
      name: '跨模块使用 @/ 别名被放行',
      filename: APIS_FILE,
      code: "import { x } from '@/pages/home';",
    },
    {
      name: '非 src 文件不校验',
      filename: '/project/scripts/build.ts',
      code: "import { x } from '@/apis/request';",
    },
    {
      name: '第三方包导入被放行',
      filename: APIS_FILE,
      code: "import axios from 'axios';",
    },
    {
      name: '../ 相对路径解析后超出 src/ 根目录时被放行',
      filename: APIS_FILE,
      code: "import { x } from '../../../lib/x';",
    },
  ],
  invalid: [
    {
      name: '模块内部使用 @/ 别名应改为相对路径',
      filename: APIS_FILE,
      code: "import { request } from '@/apis/request';",
      output: "import { request } from '../request';",
      errors: [
        {
          message: '模块内部引用请使用相对路径，不要使用 @/ 别名（当前模块：apis/）',
        },
      ],
    },
    {
      name: '跨模块使用 ../ 相对路径应改为 @/ 别名',
      filename: APIS_FILE,
      code: "import { home } from '../../pages/home';",
      output: "import { home } from '@/pages/home';",
      errors: [
        {
          message: '跨模块引用请使用 @/ 别名（从 apis/ 引用 pages/），如：@/pages/home',
        },
      ],
    },
    {
      name: '自定义 srcDir 选项下模块内部 @/ 别名应改为相对路径',
      filename: '/project/app/apis/services/flight.ts',
      options: [{ srcDir: 'app' }],
      code: "import { request } from '@/apis/request';",
      output: "import { request } from '../request';",
      errors: [
        {
          message: '模块内部引用请使用相对路径，不要使用 @/ 别名（当前模块：apis/）',
        },
      ],
    },
    {
      name: '模块内部 @/ 别名指向子目录时改为 ./ 相对路径',
      filename: APIS_FILE,
      code: "import { panel } from '@/apis/services/detail/panel';",
      output: "import { panel } from './detail/panel';",
      errors: [
        {
          message: '模块内部引用请使用相对路径，不要使用 @/ 别名（当前模块：apis/）',
        },
      ],
    },
  ],
});
