import type { ResInterceptor } from '../../types/interceptor';
import { isAxiosLikeError } from '../../utils/guards';

export const wrapperInterceptor: ResInterceptor = {
  onRejected: (error: unknown) => {
    const config = isAxiosLikeError(error) ? error.config : undefined;
    const rawMessage = isAxiosLikeError(error) ? error.message : undefined;
    const { isWrapper = true } = config ?? {};

    const errorMessage = typeof rawMessage === 'string' && rawMessage.length > 0 ? rawMessage : '未知错误';

    if (!isWrapper) {
      return Promise.reject(error);
    }

    console.log(`[包装器拦截器] 捕获到错误: ${errorMessage}`);

    return Promise.resolve({ data: null });
  },
};
