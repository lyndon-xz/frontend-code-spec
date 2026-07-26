import { Environment } from '@/constants/environment';
import { getEnvironment } from '@/utils/environment';

import { SERVICE_HOST } from '../constants/host';

export const generateBaseUrl = (serviceCode: string): string => {
  const host = SERVICE_HOST[getEnvironment()] ?? SERVICE_HOST[Environment.Production];
  return `${host}/api/${serviceCode}`;
};
