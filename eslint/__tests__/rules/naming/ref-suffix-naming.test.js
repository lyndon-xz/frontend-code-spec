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
      /*
       * 裸 `ref` 同样违规：它没有指向对象，与 no-generic-param-name 禁 `data` 同理属泛化命名，
       * 要求写成 inputRef / containerRef 这类「指向 + Ref」形态。
       */
      code: 'const ref = useRef(null);',
      errors: [{ messageId: 'refSuffix' }],
    },
    {
      // 大小写敏感：refs 结尾不算 Ref 后缀
      code: 'const inputRefs = useRef([]);',
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
