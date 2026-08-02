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
    // 变量标注不是类型引用（此处为函数类型），取不到泛型参数
    {
      code: 'const Bar: () => null = () => null;',
      filename: 'Bar.tsx',
    },
    // Props 类型声明在别的文件里，本文件无同名 interface 可改，只能跳过
    {
      code: "import type { ExternalProps } from './types';\nfunction Foo(props: ExternalProps) { return null; }",
      filename: 'Foo.tsx',
    },
    // 非函数初值的大写变量不是组件
    {
      code: 'interface Props {}\nconst Config: Props = {};',
      filename: 'Foo.tsx',
    },
    // 匿名默认导出函数无组件名可推导
    {
      code: 'interface Props {}\nexport default function (props: Props) { return null; }',
      filename: 'Foo.tsx',
    },
    // 测试文件豁免：包装组件常直接复用被测组件的 Props 类型
    {
      code: 'interface FlightCardProps {}\nconst Wrapper = (props: FlightCardProps) => null;',
      filename: 'src/components/__tests__/flight-card/index.test.tsx',
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
