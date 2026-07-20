import { afterEach, describe, expect, it } from 'vitest';

import { Environment } from '@/constants/environment';
import { getEnvironment } from '@/utils/environment';

const originalLocation = window.location;

const setHostname = (hostname: string) => {
  Object.defineProperty(window, 'location', {
    value: { hostname },
    writable: true,
    configurable: true,
  });
};

describe('getEnvironment', () => {
  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it('returns Development when hostname is localhost', () => {
    setHostname('localhost');
    expect(getEnvironment()).toBe(Environment.Development);
  });

  it('returns Development when hostname is 127.0.0.1', () => {
    setHostname('127.0.0.1');
    expect(getEnvironment()).toBe(Environment.Development);
  });

  it('returns Production for a non-local hostname', () => {
    setHostname('api.example.com');
    expect(getEnvironment()).toBe(Environment.Production);
  });
});
