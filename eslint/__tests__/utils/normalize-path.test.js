import { describe, expect, it } from 'vitest';

import { normalizePath } from '../../utils/normalize-path.js';

describe('normalizePath', () => {
  it('将反斜杠归一为正斜杠', () => {
    expect(normalizePath('src\\utils\\a.ts')).toBe('src/utils/a.ts');
  });

  it('已是正斜杠的路径原样返回', () => {
    expect(normalizePath('src/utils/a.ts')).toBe('src/utils/a.ts');
  });

  it('混合分隔符全部归一为正斜杠', () => {
    expect(normalizePath('src\\utils/nested\\a.ts')).toBe('src/utils/nested/a.ts');
  });

  it('空字符串返回空字符串', () => {
    expect(normalizePath('')).toBe('');
  });

  it('无分隔符的裸文件名原样返回', () => {
    expect(normalizePath('a.ts')).toBe('a.ts');
  });
});
