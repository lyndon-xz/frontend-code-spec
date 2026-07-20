import { RuleTester } from 'eslint';

import rule from '../../ast/naming.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

ruleTester.run('ast/naming', rule, {
  valid: [
    {
      name: '语义化动词函数名被放行',
      code: 'function saveData() {}',
    },
    {
      name: 'Ref 变量以 Ref 结尾被放行',
      code: 'const inputRef = useRef(null);',
    },
    {
      name: '具体领域参数名被放行',
      code: 'function fetchFlight(flightNo) { return flightNo; }',
    },
  ],
  invalid: [
    {
      name: 'handle 前缀函数声明应报错',
      code: 'function handleClick() {}',
      errors: [{ message: '函数禁止 handle 前缀，必须使用语义化动词（如 saveData 而非 handleClick）' }],
    },
    {
      name: 'handle 前缀变量应报错',
      code: 'const handleClick = () => {};',
      errors: [{ message: '变量/函数禁止 handle 前缀，必须使用语义化动词' }],
    },
    {
      name: '泛化参数名 data 应报错',
      code: 'function transform(data) { return data; }',
      errors: [{ message: '参数禁止泛化命名（data、params、callback、options），请使用具体的领域词汇' }],
    },
    {
      name: '带默认值的泛化参数 options 应报错',
      code: 'function setup(options = {}) { return options; }',
      errors: [{ message: '参数禁止泛化命名（data、params、callback、options），请使用具体的领域词汇' }],
    },
    {
      name: 'rest 泛化参数 params 应报错',
      code: 'function merge(...params) { return params; }',
      errors: [{ message: '参数禁止泛化命名（data、params、callback、options），请使用具体的领域词汇' }],
    },
    {
      name: 'useRef 变量未以 Ref 结尾应报错',
      code: 'const input = useRef(null);',
      errors: [{ message: 'Ref 变量必须以 Ref 结尾（如 inputRef）' }],
    },
    {
      name: '成员形式 React.useRef 未以 Ref 结尾应报错',
      code: 'const input = React.useRef(null);',
      errors: [{ message: 'Ref 变量必须以 Ref 结尾（如 inputRef）' }],
    },
    {
      name: 'on 前缀内部函数变量应报错',
      code: 'const onSave = () => {};',
      errors: [{ message: '`on` 前缀仅用于 Props 回调声明，内部函数请使用语义化动词（如 saveData 而非 onSave）' }],
    },
    {
      name: 'on 前缀内部函数声明应报错',
      code: 'function onSave() {}',
      errors: [{ message: '`on` 前缀仅用于 Props 回调声明，内部函数请使用语义化动词（如 saveData 而非 onSave）' }],
    },
  ],
});
