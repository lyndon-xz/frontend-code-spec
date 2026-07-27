import type { AxiosResponse } from 'axios';

import { SUCCESS_CODE } from '../../constants/code';
import type { ResInterceptor } from '../../types/interceptor';
import type { BusinessResponse } from '../../types/response';
import { RequestError, RequestErrorType } from '../../utils/error';
import { notifyError } from '../../utils/error-notifier';

// 判定是否为业务信封（含数值 code）；非信封响应（如文件流、三方接口）直接放行
const isBusinessResponse = (body: unknown): body is BusinessResponse => {
  return (
    typeof body === 'object' && body !== null && 'code' in body && typeof body.code === 'number'
  );
};

export const businessErrorInterceptor: ResInterceptor = {
  onFulfilled: (response: AxiosResponse) => {
    const { data: body, config } = response ?? {};
    if (!isBusinessResponse(body)) return response;

    const { code, message: responseMessage, data } = body;
    if (code === SUCCESS_CODE) {
      // 拆包：对外只暴露 data，隐藏 code/message/timestamp 信封；无 data 时归一为 null 以对齐 T | null 契约
      response.data = data ?? null;
      return response;
    }

    const { isSilent = false, customMessage } = config?.businessError ?? {};
    const errorMessage = customMessage ?? responseMessage;
    if (!isSilent) {
      notifyError(errorMessage);
    }

    throw new RequestError(RequestErrorType.Business, errorMessage, { code, config });
  },
};
