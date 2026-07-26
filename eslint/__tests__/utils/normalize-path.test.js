import { describe, expect, it } from 'vitest';

import { normalizePath } from '../../utils/normalize-path.js';

describe('normalizePath', () => {
  it('把反斜杠归一为正斜杠', () => {
    expect(normalizePath('a\\b\\c')).toBe('a/b/c');
  });

  it('已是正斜杠的路径保持不变', () => {
    expect(normalizePath('a/b/c')).toBe('a/b/c');
  });

  it('混合分隔符全部归一为正斜杠', () => {
    expect(normalizePath('a\\b/c\\d')).toBe('a/b/c/d');
  });

  it('空字符串返回空字符串', () => {
    expect(normalizePath('')).toBe('');
  });
});
