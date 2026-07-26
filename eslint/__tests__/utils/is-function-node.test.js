import { describe, expect, it } from 'vitest';

import { isFunctionNode } from '../../utils/is-function-node.js';

describe('isFunctionNode', () => {
  it('箭头函数节点返回 true', () => {
    expect(isFunctionNode({ type: 'ArrowFunctionExpression' })).toBe(true);
  });

  it('函数表达式节点返回 true', () => {
    expect(isFunctionNode({ type: 'FunctionExpression' })).toBe(true);
  });

  it('非函数类型节点返回 false', () => {
    expect(isFunctionNode({ type: 'Identifier' })).toBe(false);
  });

  it('null 返回 false', () => {
    expect(isFunctionNode(null)).toBe(false);
  });

  it('undefined 返回 false', () => {
    expect(isFunctionNode(undefined)).toBe(false);
  });
});
