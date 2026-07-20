import tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/props-interface-naming.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const TSX_FILE = 'src/feature/button.tsx';

ruleTester.run('props-interface-naming', rule, {
  valid: [
    {
      name: 'Props 接口命名符合「组件名Props」',
      filename: TSX_FILE,
      code: 'interface ButtonProps { label: string }\nconst Button = (props: ButtonProps) => { return null; };',
    },
    {
      name: '参数类型不以 Props 结尾时不校验',
      filename: TSX_FILE,
      code: 'const Foo = (props: SomeConfig) => { return null; };',
    },
    {
      name: '非 tsx 文件不校验',
      filename: 'src/feature/button.ts',
      code: 'interface Props { label: string }\nconst Button = (props: Props) => { return null; };',
    },
    {
      name: '解构声明（id 非 Identifier）不收集为组件',
      filename: TSX_FILE,
      code: 'const { Button } = mods;',
    },
    {
      name: '小写开头的变量不视为组件',
      filename: TSX_FILE,
      code: 'const button = (props: Props) => { return null; };',
    },
    {
      name: '无初始化器的声明不视为组件',
      filename: TSX_FILE,
      code: 'let Button;',
    },
    {
      name: '初始化器非函数不视为组件',
      filename: TSX_FILE,
      code: 'const Button = 42;',
    },
    {
      name: '函数表达式组件命名合规',
      filename: TSX_FILE,
      code: 'interface ButtonProps { x: number }\nconst Button = function (props: ButtonProps) { return null; };',
    },
    {
      name: '无参数的箭头函数不校验',
      filename: TSX_FILE,
      code: 'const Button = () => { return null; };',
    },
    {
      name: '参数无类型标注不校验',
      filename: TSX_FILE,
      code: 'const Button = (props) => { return null; };',
    },
    {
      name: '参数类型非类型引用（基础类型）不校验',
      filename: TSX_FILE,
      code: 'const Button = (props: string) => { return null; };',
    },
    {
      name: '参数类型为限定名（无 name）不校验',
      filename: TSX_FILE,
      code: 'const Button = (props: NS.ButtonProps) => { return null; };',
    },
    {
      name: '小写开头的函数声明不视为组件',
      filename: TSX_FILE,
      code: 'function button(props: Props) { return null; }',
    },
    {
      name: '匿名默认导出函数声明（无 id）不收集',
      filename: TSX_FILE,
      code: 'export default function (props: FooProps) { return null; }',
    },
    {
      name: '无参数的函数声明组件不校验',
      filename: TSX_FILE,
      code: 'function Button() { return null; }',
    },
    {
      name: '函数声明参数无类型标注不校验',
      filename: TSX_FILE,
      code: 'function Button(props) { return null; }',
    },
    {
      name: '函数声明参数类型非类型引用不校验',
      filename: TSX_FILE,
      code: 'function Button(props: string) { return null; }',
    },
    {
      name: '函数声明参数类型为限定名（无 name）不校验',
      filename: TSX_FILE,
      code: 'function Button(props: NS.FooProps) { return null; }',
    },
    {
      name: 'Props 命名不符但找不到对应 interface 时不报错',
      filename: TSX_FILE,
      code: 'const Button = (props: FooProps) => { return null; };',
    },
  ],
  invalid: [
    {
      name: '箭头函数组件的 Props 接口命名不规范应报错并修复',
      filename: TSX_FILE,
      code: 'interface Props { label: string }\nconst Button = (props: Props) => { return null; };',
      output: 'interface ButtonProps { label: string }\nconst Button = (props: ButtonProps) => { return null; };',
      errors: [
        {
          message: 'Props 接口应命名为 `ButtonProps`（当前：`Props`）',
        },
      ],
    },
    {
      name: '函数声明组件的 Props 接口命名不规范应报错并修复',
      filename: TSX_FILE,
      code: 'interface CardProps { x: number }\nfunction Modal(props: CardProps) { return null; }',
      output: 'interface ModalProps { x: number }\nfunction Modal(props: ModalProps) { return null; }',
      errors: [
        {
          message: 'Props 接口应命名为 `ModalProps`（当前：`CardProps`）',
        },
      ],
    },
  ],
});
