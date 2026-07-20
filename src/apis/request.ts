import type { AxiosInstance } from 'axios';
import axios from 'axios';

import type { EnhancedRequestConfig, InstanceConfig } from './types/config';
import { generateBaseUrl } from './utils/base-url';
import { analyticsReqInterceptor, analyticsResInterceptor } from './utils/interceptors/analytics';
import { businessErrorInterceptor } from './utils/interceptors/error/business';
import { networkErrorInterceptor } from './utils/interceptors/error/network';
import { ssoInterceptor } from './utils/interceptors/sso';
import { wrapperInterceptor } from './utils/interceptors/wrapper';

const DEFAULT_TIMEOUT_MS = 3000;

class RequestInstance {
  private static instances = new Map<string, AxiosInstance>();

  public static getInstance(config: InstanceConfig): AxiosInstance {
    const {
      serviceCode,
      withCredentials = true,
      timeout = DEFAULT_TIMEOUT_MS,
      headers = {
        'Content-Type': 'application/json',
      },
      reqInterceptors,
      resInterceptors,
      ...restConfig
    } = config;

    // 同一 serviceCode 在运行期只创建一个实例，首次传入的配置即为该服务的固定配置。
    if (!this.instances.has(serviceCode)) {
      const instance = axios.create({
        ...restConfig,
        headers,
        timeout,
        // 跨域请求时需要设置凭证（默认 true）
        withCredentials,
        baseURL: generateBaseUrl(serviceCode),
      });

      reqInterceptors.forEach((interceptor) => {
        instance.interceptors.request.use(interceptor.onFulfilled, interceptor.onRejected);
      });

      resInterceptors.forEach((interceptor) => {
        instance.interceptors.response.use(interceptor.onFulfilled, interceptor.onRejected);
      });

      this.instances.set(serviceCode, instance);
    }

    return this.instances.get(serviceCode)!;
  }
}

/**
 * 创建 POST 请求函数（推荐使用）
 *
 * 功能特性：
 * - 🎯 无异常处理：成功返回数据，失败返回 null
 * - 📊 自动埋点：记录请求时间、参数、响应等信息
 * - 🔧 错误处理：自动显示错误提示，支持静默配置
 * - 🔐 认证检查：自动处理 SSO 登录跳转
 * - ⚙️ 可配置：支持传统异常模式切换
 */
export const createPostRequest = (serviceCode: string) => {
  return async <T = unknown>(config: EnhancedRequestConfig): Promise<T | null> => {
    const { url, params, ...restConfig } = config;
    // 拦截器执行顺序：请求阶段 analytics（记录开始时间）→ 发送请求 → 服务端响应 → 响应阶段（按注册顺序执行）：network（网络异常）→ sso（登录态）→ business（业务码）→ analytics（埋点上报）→ wrapper（异常兜底）
    const instance = RequestInstance.getInstance({
      serviceCode,
      reqInterceptors: [analyticsReqInterceptor],
      // axios 响应拦截器按注册顺序 FIFO 执行，故此处按预期执行顺序正序注册：
      // network（网络异常）→ sso（登录态）→ business（业务码）→ analytics（埋点上报）→ wrapper（异常兜底，最外层转 null）
      resInterceptors: [
        networkErrorInterceptor,
        ssoInterceptor,
        businessErrorInterceptor,
        analyticsResInterceptor,
        wrapperInterceptor,
      ],
    });

    const response = await instance.post<T>(url, params, restConfig);

    return response.data;
  };
};
