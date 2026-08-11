import { Environment } from '@/constants/environment';

/** 内置地址仅为示例，真实项目的 host 应由构建期注入 */
export const SERVICE_HOST_BY_ENVIRONMENT: Record<Environment, string> = {
  [Environment.Development]: 'http://localhost:3000',
  [Environment.Production]: 'https://api.example.com',
};
