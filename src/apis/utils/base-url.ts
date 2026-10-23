import { Environment } from '@/constants/environment';
import { getEnvironment } from '@/utils/environment';

import { SERVICE_HOST_BY_ENVIRONMENT } from '../constants/host';

// 收成可能缺档之后，索引结果才可能是空。直接索引整表时，类型会把 host 当成一定有
const hostByEnvironment: Partial<Record<Environment, string>> = SERVICE_HOST_BY_ENVIRONMENT;

export const generateBaseUrl = (serviceCode: string): string => {
  const host =
    hostByEnvironment[getEnvironment()] ?? SERVICE_HOST_BY_ENVIRONMENT[Environment.Production];

  return `${host}/api/${serviceCode}`;
};
