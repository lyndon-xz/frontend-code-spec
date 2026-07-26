import rule from '../../../rules/react/props-interface-naming.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('props-interface-naming', rule, {
  valid: [
    // 命名合规：组件名Props
    {
      code: 'interface FooProps {}\nfunction Foo(props: FooProps) { return null; }',
      filename: 'Foo.tsx',
    },
    // React.FC 泛型参数命名合规
    {
      code: 'interface BarProps {}\nconst Bar: React.FC<BarProps> = () => null;',
      filename: 'Bar.tsx',
    },
    // 箭头函数组件命名合规
    {
      code: 'interface BazProps {}\nconst Baz = (props: BazProps) => null;',
      filename: 'Baz.tsx',
    },
    // 非 tsx 文件不校验
    {
      code: 'interface Props {}\nfunction Foo(props: Props) { return null; }',
      filename: 'Foo.ts',
    },
    // 首参无类型标注，不收集为组件
    {
      code: 'function Foo(props) { return null; }',
      filename: 'Foo.tsx',
    },
    // 首参类型非类型引用（基础类型），不收集
    {
      code: 'function Foo(props: string) { return null; }',
      filename: 'Foo.tsx',
    },
    // 首参类型引用但不以 Props 结尾，不收集
    {
      code: 'function Foo(props: SomeConfig) { return null; }',
      filename: 'Foo.tsx',
    },
    // 变量类型标注但无泛型参数，不收集
    {
      code: 'const Bar: SomeType = () => null;',
      filename: 'Bar.tsx',
    },
  ],
  invalid: [
    {
      // 命名不合规，重命名全部引用
      code: 'interface Props {}\nfunction Foo(props: Props) { return null; }',
      filename: 'Foo.tsx',
      output: 'interface FooProps {}\nfunction Foo(props: FooProps) { return null; }',
      errors: [{ messageId: 'propsNaming' }],
    },
    {
      // 多组件共用同一 interface，期望名冲突，只告警不 fix
      code: 'interface SharedProps {}\nfunction Foo(props: SharedProps) { return null; }\nfunction Bar(props: SharedProps) { return null; }',
      filename: 'C.tsx',
      output: null,
      errors: [{ messageId: 'propsNaming' }, { messageId: 'propsNaming' }],
    },
    {
      // 目标名已被占用，只告警不 fix
      code: 'interface WidgetProps {}\ninterface FooProps {}\nfunction Foo(props: WidgetProps) { return null; }',
      filename: 'Foo.tsx',
      output: null,
      errors: [{ messageId: 'propsNaming' }],
    },
    {
      // 期望名形如 I+大写会命中接口 I 前缀禁令，只告警不 fix
      code: 'interface WidgetProps {}\nfunction IButton(props: WidgetProps) { return null; }',
      filename: 'IButton.tsx',
      output: null,
      errors: [{ messageId: 'propsNaming' }],
    },
  ],
});
