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

  it('开发环境拼接本地 host 与 serviceCode', () => {
    mockGetEnvironment.mockReturnValue(Environment.Development);

    expect(generateBaseUrl('33251')).toBe('http://localhost:3000/api/33251');
  });

  it('生产环境拼接线上 host 与 serviceCode', () => {
    mockGetEnvironment.mockReturnValue(Environment.Production);

    expect(generateBaseUrl('33251')).toBe('https://api.example.com/api/33251');
  });

  it('环境无对应 host 时回退到生产 host', () => {
    mockGetEnvironment.mockReturnValue('staging' as Environment);

    expect(generateBaseUrl('abc')).toBe('https://api.example.com/api/abc');
  });
});
