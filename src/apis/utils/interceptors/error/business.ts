import { message } from 'antd';
import type { AxiosResponse } from 'axios';

import { SUCCESS_CODE } from '../../../constants/code';
import type { ResInterceptor } from '../../../types/interceptor';
import type { BusinessResponse } from '../../../types/response';
import { isEnhancedConfig } from '../../../utils/guards';

export const businessErrorInterceptor: ResInterceptor = {
  onFulfilled: (response: AxiosResponse<BusinessResponse>) => {
    const { data, config } = response ?? {};
    if (data == null) return response;

    const { code, message: responseMessage } = data;
    const businessError = isEnhancedConfig(config) ? config.businessError : undefined;
    const { isSilent = false, customMessage } = businessError ?? {};

    const errorMessage = customMessage ?? responseMessage;

    if (code !== SUCCESS_CODE) {
      if (!isSilent) {
        message.error(errorMessage);
      }

      throw new Error(errorMessage);
    }

    return response;
  },
};
