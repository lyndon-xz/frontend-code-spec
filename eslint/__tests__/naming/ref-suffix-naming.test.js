import tsparser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/naming/ref-suffix-naming.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsparser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('ref-suffix-naming', rule, {
  valid: [
    // useRef 变量以 Ref 结尾
    'const inputRef = useRef(null);',
    // React.useRef 变量以 Ref 结尾
    'const inputRef = React.useRef(null);',
    // 类字段 useRef 以 Ref 结尾
    'class C { inputRef = useRef(null); }',
    // 类字段 React.useRef 以 Ref 结尾
    'class C { inputRef = React.useRef(null); }',
    // 非 useRef 调用不受约束
    'const input = useState(0);',
    'const value = getRef();',
    // 计算属性类字段放行
    'class C { ["input"] = useRef(null); }',
    // 计算标识符键的 useRef 类字段放行（computed 分支）
    'class C { [input] = useRef(null); }',
    // 计算标识符键的 React.useRef 类字段放行（computed 分支）
    'class C { [input] = React.useRef(null); }',
  ],
  invalid: [
    // useRef 变量未以 Ref 结尾
    {
      code: 'const input = useRef(null);',
      errors: [{ messageId: 'refSuffix' }],
    },
    // React.useRef 变量未以 Ref 结尾
    {
      code: 'const input = React.useRef(null);',
      errors: [{ messageId: 'refSuffix' }],
    },
    // 类字段 useRef 未以 Ref 结尾
    {
      code: 'class C { input = useRef(null); }',
      errors: [{ messageId: 'refSuffix' }],
    },
    // 类字段 React.useRef 未以 Ref 结尾
    {
      code: 'class C { input = React.useRef(null); }',
      errors: [{ messageId: 'refSuffix' }],
    },
  ],
});
