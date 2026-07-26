import { Environment } from '@/constants/environment';

/**
 * 各环境的接口 host。实际项目应改为从构建期环境变量注入（如 import.meta.env / process.env），
 * 此处内置默认值仅用于示例与本地开发；新增环境时补齐此映射即可。
 */
export const SERVICE_HOST: Record<Environment, string> = {
  [Environment.Development]: 'http://localhost:3000',
  [Environment.Production]: 'https://api.example.com',
};
