import { describe, expect, it } from 'vitest';

import { isExemptFile } from '../../utils/is-exempt-file.js';

describe('isExemptFile', () => {
  it('空文件名返回 false', () => {
    expect(isExemptFile('')).toBe(false);
  });

  it('undefined 返回 false', () => {
    expect(isExemptFile(undefined)).toBe(false);
  });

  describe('目录段豁免', () => {
    it('__tests__ 目录下的文件豁免', () => {
      expect(isExemptFile('src/__tests__/a.ts')).toBe(true);
    });

    it('__mocks__ 目录下的文件豁免', () => {
      expect(isExemptFile('src/__mocks__/a.ts')).toBe(true);
    });

    it('mocks 目录下的文件豁免', () => {
      expect(isExemptFile('src/mocks/a.ts')).toBe(true);
    });

    it('Windows 反斜杠路径同样按目录段豁免', () => {
      expect(isExemptFile('src\\__tests__\\a.ts')).toBe(true);
    });

    it('目录名为豁免段子串时不豁免', () => {
      expect(isExemptFile('src/my-mocks-project/a.ts')).toBe(false);
    });

    it('豁免目录段出现在文件名位置（无父路径命中）不因目录规则豁免', () => {
      expect(isExemptFile('__tests__')).toBe(false);
    });
  });

  describe('文件名后缀豁免', () => {
    it('.test.ts 文件豁免', () => {
      expect(isExemptFile('src/a.test.ts')).toBe(true);
    });

    it('.test.tsx 文件豁免', () => {
      expect(isExemptFile('src/a.test.tsx')).toBe(true);
    });

    it('.d.ts 声明文件豁免', () => {
      expect(isExemptFile('src/types.d.ts')).toBe(true);
    });

    it('.config.ts 配置文件豁免', () => {
      expect(isExemptFile('vite.config.ts')).toBe(true);
    });

    it('.d.tsx 不算声明文件，不豁免', () => {
      expect(isExemptFile('src/types.d.tsx')).toBe(false);
    });

    it('普通源文件不豁免', () => {
      expect(isExemptFile('src/a.ts')).toBe(false);
    });
  });
});
