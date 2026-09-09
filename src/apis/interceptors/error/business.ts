import type { AxiosResponse } from 'axios';

import { SUCCESS_CODE } from '../../constants/codes';
import type { ResInterceptor } from '../../types/interceptors';
import type { BusinessResponse } from '../../types/responses';
import { hasNumberField } from '../../utils/envelope';
import { RequestError, RequestErrorType } from '../../utils/error';
import { notifyError } from '../../utils/error-notifier';

const DEFAULT_BUSINESS_MESSAGE = '操作失败，请稍后重试';

// 非信封响应（文件流、三方接口）直接放行
const isBusinessResponse = (body: unknown): body is BusinessResponse =>
  hasNumberField(body, 'code');

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
    // 契约把 message 标为可选，且实测网关也可能下发空串，故 typeof 与长度两层都要判
    const resolvedMessage =
      typeof responseMessage === 'string' && responseMessage.length > 0
        ? responseMessage
        : DEFAULT_BUSINESS_MESSAGE;
    const errorMessage = customMessage ?? resolvedMessage;
    if (!isSilent) {
      notifyError(errorMessage);
    }

    throw new RequestError(RequestErrorType.Business, errorMessage, { code, config });
  },
};
