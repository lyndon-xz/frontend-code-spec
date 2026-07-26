import tsparser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/react/no-unnecessary-arrow-wrapper.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsparser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('no-unnecessary-arrow-wrapper', rule, {
  valid: [
    // 直接引用函数，无箭头包裹
    'const c = <button onClick={handleClick} />;',
    // async 箭头改写会丢失 async 语义，跳过
    'const c = <button onClick={async () => fn()} />;',
    // callee 为成员表达式存在 this 绑定丢失风险，跳过
    'const c = <button onClick={() => obj.fn()} />;',
    // 成员表达式 + 参数透传同样跳过
    'const c = <button onClick={(e) => obj.fn(e)} />;',
    // 多条语句的代码块不属于简单包裹
    'const c = <button onClick={() => { doA(); doB(); }} />;',
    // 单条语句但既非调用表达式也非 return 调用，跳过（else 分支）
    'const c = <button onClick={() => { const x = 1; }} />;',
    // 单条 return 但返回值非调用表达式，跳过
    'const c = <button onClick={() => { return x; }} />;',
    // 参数个数与实参不一致，非纯透传
    'const c = <button onClick={(e) => fn(e, 1)} />;',
    // 实参并非透传箭头参数
    'const c = <button onClick={(e) => fn(other)} />;',
    // body 非调用表达式
    'const c = <button onClick={() => x + 1} />;',
    // 非表达式容器（字符串字面量属性）放行
    'const c = <button title="ok" />;',
  ],
  invalid: [
    // 无参包裹 () => fn()，只告警不自动修复（避免隐式 event 透传）
    {
      code: 'const c = <button onClick={() => fn()} />;',
      errors: [{ messageId: 'unwrapNoArg' }],
      output: null,
    },
    // 代码块内无参调用同样只告警
    {
      code: 'const c = <button onClick={() => { fn(); }} />;',
      errors: [{ messageId: 'unwrapNoArg' }],
      output: null,
    },
    // 单参数透传，可自动修复为直接引用
    {
      code: 'const c = <button onClick={(e) => fn(e)} />;',
      errors: [{ messageId: 'unwrapPassthrough' }],
      output: 'const c = <button onClick={fn} />;',
    },
    // 多参数逐一透传，可自动修复
    {
      code: 'const c = <button onClick={(a, b) => fn(a, b)} />;',
      errors: [{ messageId: 'unwrapPassthrough' }],
      output: 'const c = <button onClick={fn} />;',
    },
    // 代码块内 return 透传，可自动修复
    {
      code: 'const c = <button onClick={(e) => { return fn(e); }} />;',
      errors: [{ messageId: 'unwrapPassthrough' }],
      output: 'const c = <button onClick={fn} />;',
    },
  ],
});
