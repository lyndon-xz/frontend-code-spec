import tsparser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/react/props-interface-naming.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsparser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('props-interface-naming', rule, {
  valid: [
    // 命名已符合 组件名Props
    {
      code: 'interface FooProps {}\nfunction Foo(props: FooProps) {}',
      filename: 'Foo.tsx',
    },
    // 非 .tsx 文件不校验
    {
      code: 'interface BarProps {}\nfunction Foo(props: BarProps) {}',
      filename: 'Foo.ts',
    },
    // 组件无 Props 类型标注
    {
      code: 'function Foo() { return null; }',
      filename: 'Foo.tsx',
    },
    // 小写函数不视为组件
    {
      code: 'interface BarProps {}\nfunction foo(props: BarProps) {}',
      filename: 'Foo.tsx',
    },
    // React.FC 泛型命名已正确
    {
      code: 'interface FooProps {}\nconst Foo: React.FC<FooProps> = () => null;',
      filename: 'Foo.tsx',
    },
    // 首参类型不以 Props 结尾：不视为组件 Props（typeRefName 返回 null）
    {
      code: 'interface SomeType {}\nfunction Foo(props: SomeType) { return null; }',
      filename: 'Foo.tsx',
    },
    // 首参为对象字面量类型而非 TSTypeReference（typeRefName 返回 null）
    {
      code: 'function Foo(props: {}) { return null; }',
      filename: 'Foo.tsx',
    },
    // React.FC 无泛型参数（propsNameFromFcAnnotation 返回 null）
    {
      code: 'const Foo: React.FC = () => null;',
      filename: 'Foo.tsx',
    },
    // 首参无类型标注（propsNameFromParam 返回 null）
    {
      code: 'function Foo(props) { return null; }',
      filename: 'Foo.tsx',
    },
    // 组件无参数（params 为空，propsNameFromParam 返回 null）
    {
      code: 'const Foo = () => null;',
      filename: 'Foo.tsx',
    },
  ],
  invalid: [
    // 函数声明组件：BarProps 应重命名为 FooProps 并同步全部引用
    {
      code: 'interface BarProps {}\nfunction Foo(props: BarProps) {}',
      filename: 'Foo.tsx',
      errors: [{ messageId: 'propsNaming' }],
      output: 'interface FooProps {}\nfunction Foo(props: FooProps) {}',
    },
    // 箭头函数组件：同样修复
    {
      code: 'interface BarProps {}\nconst Foo = (props: BarProps) => null;',
      filename: 'Foo.tsx',
      errors: [{ messageId: 'propsNaming' }],
      output: 'interface FooProps {}\nconst Foo = (props: FooProps) => null;',
    },
    // React.FC 泛型参数：修复泛型引用
    {
      code: 'interface BarProps {}\nconst Foo: React.FC<BarProps> = () => null;',
      filename: 'Foo.tsx',
      errors: [{ messageId: 'propsNaming' }],
      output: 'interface FooProps {}\nconst Foo: React.FC<FooProps> = () => null;',
    },
    // 多个组件共用同一 interface：期望名冲突，只告警不修复
    {
      code: 'interface SharedProps {}\nfunction Foo(props: SharedProps) {}\nfunction Bar(props: SharedProps) {}',
      filename: 'components.tsx',
      errors: [{ messageId: 'propsNaming' }, { messageId: 'propsNaming' }],
      output: null,
    },
    // 目标名已被其它 interface 占用：只告警不修复
    {
      code: 'interface BarProps {}\ninterface FooProps {}\nfunction Foo(props: BarProps) {}',
      filename: 'Foo.tsx',
      errors: [{ messageId: 'propsNaming' }],
      output: null,
    },
    // 期望名命中 I 前缀接口禁令（IPanelProps）：只告警不修复
    {
      code: 'interface BarProps {}\nfunction IPanel(props: BarProps) {}',
      filename: 'IPanel.tsx',
      errors: [{ messageId: 'propsNaming' }],
      output: null,
    },
  ],
});
