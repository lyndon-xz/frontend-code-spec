import { describe, expect, it } from 'vitest';

import { isFunctionNode } from '../../utils/is-function-node.js';

describe('isFunctionNode', () => {
  it('箭头函数节点判定为函数', () => {
    expect(isFunctionNode({ type: 'ArrowFunctionExpression' })).toBe(true);
  });

  it('函数表达式节点判定为函数', () => {
    expect(isFunctionNode({ type: 'FunctionExpression' })).toBe(true);
  });

  it('非函数节点判定为否', () => {
    expect(isFunctionNode({ type: 'Identifier' })).toBe(false);
  });

  it('null 判定为否', () => {
    expect(isFunctionNode(null)).toBe(false);
  });

  it('undefined 判定为否', () => {
    expect(isFunctionNode(undefined)).toBe(false);
  });
});
