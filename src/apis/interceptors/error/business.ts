import type { AxiosResponse } from 'axios';

import { SUCCESS_CODE } from '../../constants/code';
import type { ResInterceptor } from '../../types/interceptor';
import type { BusinessResponse } from '../../types/response';
import { RequestError, RequestErrorType } from '../../utils/error';
import { notifyError } from '../../utils/error-notifier';

const DEFAULT_BUSINESS_MESSAGE = '操作失败，请稍后重试';

// 非信封响应（文件流、三方接口）直接放行
const isBusinessResponse = (body: unknown): body is BusinessResponse => {
  return (
    typeof body === 'object' && body !== null && 'code' in body && typeof body.code === 'number'
  );
};

export const businessErrorInterceptor: ResInterceptor = {
  onFulfilled: (response: AxiosResponse) => {
    const { data: body, config } = response;
    if (!isBusinessResponse(body)) {
      return response;
    }

    const { code, message: responseMessage, data } = body;
    if (code === SUCCESS_CODE) {
      // 拆包：对外只暴露 data，无 data 时归一为 null
      response.data = data ?? null;
      return response;
    }

    const { isSilent = false, customMessage } = config?.businessError ?? {};
    // 服务端 message 为空时兜底
    const serverMessage =
      typeof responseMessage === 'string' && responseMessage.length > 0
        ? responseMessage
        : DEFAULT_BUSINESS_MESSAGE;
    const errorMessage = customMessage ?? serverMessage;
    if (!isSilent) {
      notifyError(errorMessage);
    }

    throw new RequestError(RequestErrorType.Business, errorMessage, { code, config });
  },
};
