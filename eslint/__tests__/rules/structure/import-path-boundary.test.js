import rule from '../../../rules/structure/import-path-boundary.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('import-path-boundary', rule, {
  valid: [
    // 模块内部同级相对路径
    { code: "import x from './bar';", filename: '/proj/src/apis/foo.ts' },
    // 跨模块用别名
    { code: "import x from '@/utils/x';", filename: '/proj/src/apis/foo.ts' },
    // 第三方裸模块不处理
    { code: "import axios from 'axios';", filename: '/proj/src/apis/foo.ts' },
    // 文件不在 src 下，规则不生效
    { code: "import x from '@/apis/bar';", filename: '/proj/lib/foo.ts' },
    // 模块内部向上相对引用（仍在本模块内）
    { code: "import x from '../bar';", filename: '/proj/src/apis/sub/foo.ts' },
    // 相对路径逃出 src，跳过
    { code: "import x from '../../outside';", filename: '/proj/src/apis/foo.ts' },
  ],
  invalid: [
    {
      // 同模块却用别名 → 应改相对路径
      code: "import x from '@/apis/bar';",
      filename: '/proj/src/apis/foo.ts',
      output: "import x from './bar';",
      errors: [{ messageId: 'useRelative' }],
    },
    {
      // 跨模块却用相对路径 → 应改别名
      code: "import x from '../../utils/x';",
      filename: '/proj/src/apis/sub/foo.ts',
      output: "import x from '@/utils/x';",
      errors: [{ messageId: 'useAlias' }],
    },
  ],
});
