import { beforeEach, describe, expect, it, vi } from 'vitest';

import { generateBaseUrl } from '@/apis/utils/base-url';
import { Environment } from '@/constants/environment';
import { getEnvironment } from '@/utils/environment';

vi.mock('@/utils/environment', () => ({
  getEnvironment: vi.fn(),
}));

const mockGetEnvironment = vi.mocked(getEnvironment);

describe('generateBaseUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds a localhost URL in development', () => {
    mockGetEnvironment.mockReturnValue(Environment.Development);
    expect(generateBaseUrl('33238')).toBe('http://localhost:3000/api/33238');
  });

  it('builds the production URL in production', () => {
    mockGetEnvironment.mockReturnValue(Environment.Production);
    expect(generateBaseUrl('33238')).toBe('https://api.example.com/api/33238');
  });

  it('falls back to the production URL for an unknown environment', () => {
    mockGetEnvironment.mockReturnValue('staging' as Environment);
    expect(generateBaseUrl('33238')).toBe('https://api.example.com/api/33238');
  });
});
