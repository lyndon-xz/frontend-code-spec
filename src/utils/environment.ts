import { Environment, LOCAL_HOSTNAMES } from '@/constants/environment';

export const getEnvironment = () => {
  return LOCAL_HOSTNAMES.includes(window.location.hostname) ? Environment.Development : Environment.Production;
};
