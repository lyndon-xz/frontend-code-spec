import type { AxiosLikeError, EnhancedRequestConfig } from '../types/config';

export const isEnhancedConfig = (config: unknown): config is EnhancedRequestConfig => {
  return typeof config === 'object' && config !== null;
};

export const isAxiosLikeError = (error: unknown): error is AxiosLikeError => {
  return typeof error === 'object' && error !== null && 'config' in error;
};
