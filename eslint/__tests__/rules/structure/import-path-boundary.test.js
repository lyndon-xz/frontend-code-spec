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
    // pages 下每个页面各是一个模块，跨页面走别名
    { code: "import x from '@/pages/detail/b';", filename: '/proj/src/pages/search/a.ts' },
    // 直接位于容器目录下的文件属于 pages 本身，引用某个页面算跨模块
    { code: "import x from '@/pages/search/x';", filename: '/proj/src/pages/index.ts' },
    // containerDirs 为空时整个 pages 是一个模块，跨页面相对引用不报
    {
      code: "import x from '../detail/b';",
      filename: '/proj/src/pages/search/a.ts',
      options: [{ containerDirs: [] }],
    },
    // 自定义容器目录后，features 下的子目录互为跨模块
    {
      code: "import x from '@/features/cart/c';",
      filename: '/proj/src/features/order/a.ts',
      options: [{ containerDirs: ['features'] }],
    },
    // 非容器目录仍以第一段为模块
    { code: "import x from '../x';", filename: '/proj/src/utils/sub/a.ts' },
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
    {
      code: "import x from '../detail/b';",
      filename: '/proj/src/pages/search/a.ts',
      output: "import x from '@/pages/detail/b';",
      errors: [{ messageId: 'useAlias' }],
    },
    {
      code: "import x from '@/pages/search/c';",
      filename: '/proj/src/pages/search/a.ts',
      output: "import x from './c';",
      errors: [{ messageId: 'useRelative' }],
    },
    {
      // 目录导入的末段按页面目录看待
      code: "import x from '../detail';",
      filename: '/proj/src/pages/search/a.ts',
      output: "import x from '@/pages/detail';",
      errors: [{ messageId: 'useAlias' }],
    },
    {
      code: "import x from '../cart/c';",
      filename: '/proj/src/features/order/a.ts',
      options: [{ containerDirs: ['features'] }],
      output: "import x from '@/features/cart/c';",
      errors: [{ messageId: 'useAlias' }],
    },
    {
      // 自定义容器目录后 pages 不再是容器，整个 pages 是一个模块
      code: "import x from '@/pages/detail/b';",
      filename: '/proj/src/pages/search/a.ts',
      options: [{ containerDirs: ['features'] }],
      output: "import x from '../detail/b';",
      errors: [{ messageId: 'useRelative' }],
    },
    {
      code: "import x from '@/utils/x';",
      filename: '/proj/src/utils/sub/a.ts',
      output: "import x from '../x';",
      errors: [{ messageId: 'useRelative' }],
    },
  ],
});
