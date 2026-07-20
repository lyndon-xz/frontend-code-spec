import { Environment } from '@/constants/environment';
import { getEnvironment } from '@/utils/environment';

export const generateBaseUrl = (serviceCode: string) => {
  const environment = getEnvironment();

  const servicePrefix = {
    [Environment.Development]: `http://localhost:3000/api/${serviceCode}`,
    [Environment.Production]: `https://api.example.com/api/${serviceCode}`,
  };

  return servicePrefix[environment] ?? servicePrefix[Environment.Production];
};
