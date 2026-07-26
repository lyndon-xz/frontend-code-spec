import rule from '../../../rules/naming/ref-suffix-naming.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('ref-suffix-naming', rule, {
  valid: [
    'const inputRef = useRef(null);',
    'const inputRef = React.useRef(null);',
    'class C { inputRef = useRef(null); }',
    'class C { inputRef = React.useRef(null); }',
    // 非 useRef 调用不受约束
    'const input = getInput();',
    // 计算键的类字段不校验（覆盖 computed 守卫分支）
    'class C { [dynamicKey] = useRef(null); }',
    'class C { [dynamicKey] = React.useRef(null); }',
  ],
  invalid: [
    {
      code: 'const input = useRef(null);',
      errors: [{ messageId: 'refSuffix' }],
    },
    {
      code: 'const input = React.useRef(null);',
      errors: [{ messageId: 'refSuffix' }],
    },
    {
      code: 'class C { input = useRef(null); }',
      errors: [{ messageId: 'refSuffix' }],
    },
    {
      code: 'class C { input = React.useRef(null); }',
      errors: [{ messageId: 'refSuffix' }],
    },
  ],
});
