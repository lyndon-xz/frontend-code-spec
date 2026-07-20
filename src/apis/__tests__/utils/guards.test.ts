import { describe, expect, it } from 'vitest';

import { isAxiosLikeError, isEnhancedConfig } from '@/apis/utils/guards';

describe('isEnhancedConfig', () => {
  it('accepts a non-null object', () => {
    expect(isEnhancedConfig({ url: '/api/x' })).toBe(true);
  });

  it('rejects null', () => {
    expect(isEnhancedConfig(null)).toBe(false);
  });

  it('rejects a non-object value', () => {
    expect(isEnhancedConfig('nope')).toBe(false);
  });
});

describe('isAxiosLikeError', () => {
  it('accepts an object carrying a config field', () => {
    expect(isAxiosLikeError({ config: {} })).toBe(true);
  });

  it('rejects an object without a config field', () => {
    expect(isAxiosLikeError({ message: 'boom' })).toBe(false);
  });

  it('rejects null', () => {
    expect(isAxiosLikeError(null)).toBe(false);
  });

  it('rejects a non-object value', () => {
    expect(isAxiosLikeError(42)).toBe(false);
  });
});
