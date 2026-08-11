import rule from '../../../rules/structure/import-path-boundary.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('import-path-boundary', rule, {
  valid: [
    { code: "import x from './bar';", filename: '/proj/src/apis/foo.ts' },
    { code: "import x from '@/utils/x';", filename: '/proj/src/apis/foo.ts' },
    { code: "import axios from 'axios';", filename: '/proj/src/apis/foo.ts' },
    // 文件不在 src 下，规则不生效
    { code: "import x from '@/apis/bar';", filename: '/proj/lib/foo.ts' },
    // srcDir 为 app 时，src 下的文件不受约束
    {
      code: "import x from '@/apis/bar';",
      filename: '/proj/src/apis/foo.ts',
      options: [{ srcDir: 'app' }],
    },
    { code: "import x from '../bar';", filename: '/proj/src/apis/sub/foo.ts' },
    // 相对路径逃出 src，跳过
    { code: "import x from '../../outside';", filename: '/proj/src/apis/foo.ts' },
    // 测试文件豁免：__tests__ 里按别名引用被测模块是约定写法
    {
      code: "import x from '@/apis/bar';",
      filename: '/proj/src/apis/__tests__/foo.test.ts',
    },
  ],
  invalid: [
    {
      code: "import x from '@/apis/bar';",
      filename: '/proj/src/apis/foo.ts',
      output: "import x from './bar';",
      errors: [{ messageId: 'useRelative' }],
    },
    {
      // 指向上层目录时修成 '../request'，不额外拼 './' 前缀
      code: "import x from '@/apis/request';",
      filename: '/proj/src/apis/services/flight.ts',
      output: "import x from '../request';",
      errors: [{ messageId: 'useRelative' }],
    },
    {
      code: "import x from '../../utils/x';",
      filename: '/proj/src/apis/sub/foo.ts',
      output: "import x from '@/utils/x';",
      errors: [{ messageId: 'useAlias' }],
    },
  ],
});
