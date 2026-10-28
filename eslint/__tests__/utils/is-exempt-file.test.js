import { describe, expect, it } from 'vitest';

import { EXEMPT_GLOBS, isExemptFile } from '../../utils/is-exempt-file.js';

describe('isExemptFile', () => {
  it('普通源码文件不豁免', () => {
    expect(isExemptFile('src/apis/request.ts')).toBe(false);
  });

  it('未提供文件名时 ESLint 给出的 <input> 不豁免', () => {
    expect(isExemptFile('<input>')).toBe(false);
  });

  describe('目录段豁免', () => {
    it('__tests__ 目录下的文件豁免', () => {
      expect(isExemptFile('src/apis/__tests__/request.test.ts')).toBe(true);
    });

    it('__mocks__ 目录下的文件豁免', () => {
      expect(isExemptFile('src/__mocks__/axios.ts')).toBe(true);
    });

    it('mocks 目录下的文件豁免', () => {
      expect(isExemptFile('test/mocks/server.ts')).toBe(true);
    });

    it('仅目录名含 mocks 子串不算豁免目录段', () => {
      expect(isExemptFile('my-mocks-project/index.ts')).toBe(false);
    });

    it('反斜杠路径归一后仍能命中豁免目录段', () => {
      expect(isExemptFile('src\\__tests__\\a.ts')).toBe(true);
    });
  });

  describe('文件名后缀豁免', () => {
    it('.test.ts 文件豁免', () => {
      expect(isExemptFile('foo.test.ts')).toBe(true);
    });

    it('.test.tsx 文件豁免', () => {
      expect(isExemptFile('foo.test.tsx')).toBe(true);
    });

    it('.d.ts 声明文件豁免', () => {
      expect(isExemptFile('types/global.d.ts')).toBe(true);
    });

    it('.d.tsx 不属于声明文件后缀，不豁免', () => {
      expect(isExemptFile('foo.d.tsx')).toBe(false);
    });

    it('.config.js 配置文件豁免', () => {
      expect(isExemptFile('vitest.config.js')).toBe(true);
    });
  });

  describe('EXEMPT_GLOBS 与 isExemptFile 同源', () => {
    it('覆盖三类豁免目录段与四类豁免文件名', () => {
      expect(EXEMPT_GLOBS).toEqual([
        '**/__tests__/**',
        '**/__mocks__/**',
        '**/mocks/**',
        '**/*.test.*',
        '**/*.spec.*',
        '**/*.d.ts',
        '**/*.config.*',
      ]);
    });

    /*
     * 上面那条是快照断言，只改一侧不会失败；这条交叉校验两侧口径：
     * 每条文件名 glob 都要有一个 isExemptFile 认得的实际路径，漏派生就在这里暴露。
     */
    it('每条文件名 glob 都对应一个 isExemptFile 认得的路径', () => {
      const sampleByGlob = {
        '**/*.test.*': 'a.test.ts',
        '**/*.spec.*': 'a.spec.ts',
        '**/*.d.ts': 'a.d.ts',
        '**/*.config.*': 'a.config.js',
      };
      const filenameGlobs = EXEMPT_GLOBS.filter((glob) => !glob.endsWith('/**'));

      expect(filenameGlobs).toEqual(Object.keys(sampleByGlob));
      for (const sample of Object.values(sampleByGlob)) {
        expect(isExemptFile(sample)).toBe(true);
      }
    });
  });
});
