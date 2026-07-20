import tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/no-unnecessary-arrow-wrapper.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const TSX_FILE = 'src/feature/demo.tsx';

ruleTester.run('no-unnecessary-arrow-wrapper', rule, {
  valid: [
    {
      name: '直接传递函数引用被放行',
      filename: TSX_FILE,
      code: 'const el = <button onClick={fn} />;',
    },
    {
      name: '成员表达式调用（存在 this 绑定风险）被放行',
      filename: TSX_FILE,
      code: 'const el = <button onClick={() => obj.fn()} />;',
    },
    {
      name: '多语句代码块被放行',
      filename: TSX_FILE,
      code: 'const el = <button onClick={() => { doA(); doB(); }} />;',
    },
    {
      name: '参数与实参数量不一致被放行',
      filename: TSX_FILE,
      code: 'const el = <button onClick={(e) => fn(e, extra)} />;',
    },
    {
      name: '参数名与实参名不匹配被放行',
      filename: TSX_FILE,
      code: 'const el = <button onClick={(e) => fn(other)} />;',
    },
  ],
  invalid: [
    {
      name: '无参数包裹应告警（不提供 fix）',
      filename: TSX_FILE,
      code: 'const el = <button onClick={() => fn()} />;',
      errors: [
        {
          message: '不必要的箭头函数包裹，如需透传参数可直接使用 `fn`，如需吞发事件则保留',
        },
      ],
    },
    {
      name: '代码块内无参数包裹应告警',
      filename: TSX_FILE,
      code: 'const el = <button onClick={() => { fn(); }} />;',
      errors: [
        {
          message: '不必要的箭头函数包裹，如需透传参数可直接使用 `fn`，如需吞发事件则保留',
        },
      ],
    },
    {
      name: '参数透传应报错并可自动修复',
      filename: TSX_FILE,
      code: 'const el = <button onClick={(e) => fn(e)} />;',
      output: 'const el = <button onClick={fn} />;',
      errors: [
        {
          message: '不必要的箭头函数包裹，参数透传可直接使用 `fn`',
        },
      ],
    },
  ],
});
