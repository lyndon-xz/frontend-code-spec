import { Environment } from '@/constants/environment';
import { getEnvironment } from '@/utils/environment';

import { SERVICE_HOST_BY_ENVIRONMENT } from '../constants/host';

export const generateBaseUrl = (serviceCode: string): string => {
  const host =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- 环境值来自业务侧注入的 provider，运行时可能不在枚举内，类型保证不了一定有对应 host
    SERVICE_HOST_BY_ENVIRONMENT[getEnvironment()] ??
    SERVICE_HOST_BY_ENVIRONMENT[Environment.Production];
  return `${host}/api/${serviceCode}`;
};
