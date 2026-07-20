import { describe, expect, it } from 'vitest';

import { isExemptFile } from '../../utils/is-exempt-file.js';

describe('isExemptFile', () => {
  it('returns false for an empty filename', () => {
    expect(isExemptFile('')).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isExemptFile(undefined)).toBe(false);
  });

  it('flags files inside a __tests__ directory', () => {
    expect(isExemptFile('src/feature/__tests__/demo.ts')).toBe(true);
  });

  it('flags files inside a mocks directory', () => {
    expect(isExemptFile('src/mocks/flight.ts')).toBe(true);
  });

  it('flags .test. files', () => {
    expect(isExemptFile('src/feature/demo.test.ts')).toBe(true);
  });

  it('flags .d.ts declaration files', () => {
    expect(isExemptFile('src/types/global.d.ts')).toBe(true);
  });

  it('flags .config. files', () => {
    expect(isExemptFile('vitest.config.ts')).toBe(true);
  });

  it('returns false for a regular source file', () => {
    expect(isExemptFile('src/feature/flight.ts')).toBe(false);
  });
});
