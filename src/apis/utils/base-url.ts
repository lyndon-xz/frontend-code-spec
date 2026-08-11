import { Environment } from '@/constants/environment';
import { getEnvironment } from '@/utils/environment';

import { SERVICE_HOST_BY_ENVIRONMENT } from '../constants/host';

export const generateBaseUrl = (serviceCode: string): string => {
  const host =
    SERVICE_HOST_BY_ENVIRONMENT[getEnvironment()] ??
    SERVICE_HOST_BY_ENVIRONMENT[Environment.Production];
  return `${host}/api/${serviceCode}`;
};
