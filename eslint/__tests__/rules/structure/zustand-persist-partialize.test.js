import rule from '../../../rules/structure/zustand-persist-partialize.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

const withPartialize = [
  "import { persist } from 'zustand/middleware';",
  'create(persist((set) => ({ count: 0 }), { partialize: (state) => ({ count: state.count }) }));',
].join('\n');

ruleTester.run('zustand-persist-partialize', rule, {
  valid: [
    withPartialize,
    [
      "import { persist } from 'zustand/middleware';",
      "create(persist((set) => ({ count: 0 }), { whitelist: ['count'] }));",
    ].join('\n'),
    [
      "import { persist as withPersist } from 'zustand/persist';",
      'create(withPersist((set) => ({ count: 0 }), { partialize: (state) => state }));',
    ].join('\n'),
    // 选项来自变量时静态判不出，不报
    [
      "import { persist } from 'zustand/middleware';",
      'create(persist((set) => ({ count: 0 }), sharedOptions));',
    ].join('\n'),
    // 不是 zustand 的 persist：同名函数不受这条规则约束
    "import { persist } from './storage'; persist({ count: 0 });",
    'persist({ count: 0 });',
  ],
  invalid: [
    {
      code: [
        "import { persist } from 'zustand/middleware';",
        'create(persist((set) => ({ count: 0 })));',
      ].join('\n'),
      errors: [{ messageId: 'partialize' }],
    },
    {
      code: [
        "import { persist } from 'zustand/middleware';",
        "create(persist((set) => ({ count: 0 }), { name: 'counter' }));",
      ].join('\n'),
      errors: [{ messageId: 'partialize' }],
    },
    {
      code: [
        "import { persist as withPersist } from 'zustand/middleware';",
        "create(withPersist((set) => ({ count: 0 }), { name: 'counter' }));",
      ].join('\n'),
      errors: [{ messageId: 'partialize' }],
    },
  ],
});
