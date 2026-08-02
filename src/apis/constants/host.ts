import { Environment } from '@/constants/environment';

/**
 * 各环境的接口 host，新增环境时补齐此映射。
 * 内置地址仅为示例：真实项目的 host 与环境判定应一并由构建期注入，见 setEnvironmentProvider。
 */
export const SERVICE_HOST: Record<Environment, string> = {
  [Environment.Development]: 'http://localhost:3000',
  [Environment.Production]: 'https://api.example.com',
};
