import { message } from 'antd';

import { createSwappable } from '@/utils/swappable';

/** 提示实现可替换，避免拦截器直接依赖 UI 库 */
export type ErrorNotifier = (errorMessage: string) => void;

const defaultNotifier: ErrorNotifier = (errorMessage) => {
  message.error(errorMessage);
};

const notifierSlot = createSwappable(defaultNotifier);

export const setErrorNotifier = notifierSlot.set;

export const resetErrorNotifier = notifierSlot.reset;

export const notifyError = (errorMessage: string) => {
  notifierSlot.get()(errorMessage);
};
