import { describe, expect, it } from 'vitest';

import { toErrorLevel } from '../../utils/to-error-level.js';

describe('toErrorLevel', () => {
  it('字符串与数字形态的 warn 升为 error', () => {
    expect(toErrorLevel({ a: 'warn', b: 1 })).toEqual({ a: 'error', b: 'error' });
  });

  it('数组形态只改级别，选项原样保留', () => {
    expect(toErrorLevel({ a: ['warn', { max: 1 }] })).toEqual({ a: ['error', { max: 1 }] });
  });

  it('error 与 off 不变', () => {
    expect(toErrorLevel({ a: 'error', b: 'off', c: 0, d: ['off', { x: true }] })).toEqual({
      a: 'error',
      b: 'off',
      c: 0,
      d: ['off', { x: true }],
    });
  });
});
