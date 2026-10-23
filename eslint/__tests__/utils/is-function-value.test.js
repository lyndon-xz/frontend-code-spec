import { describe, expect, it } from 'vitest';

import { isFunctionValue } from '../../utils/create-prefix-rule.js';

describe('isFunctionValue', () => {
  it('箭头函数节点判定为函数', () => {
    expect(isFunctionValue({ type: 'ArrowFunctionExpression' })).toBe(true);
  });

  it('函数表达式节点判定为函数', () => {
    expect(isFunctionValue({ type: 'FunctionExpression' })).toBe(true);
  });

  it('非函数节点判定为否', () => {
    expect(isFunctionValue({ type: 'Identifier' })).toBe(false);
  });

  it('null 判定为否', () => {
    expect(isFunctionValue(null)).toBe(false);
  });

  it('undefined 判定为否', () => {
    expect(isFunctionValue(undefined)).toBe(false);
  });
});
