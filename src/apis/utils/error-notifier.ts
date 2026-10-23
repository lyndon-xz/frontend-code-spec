import { message } from 'antd';

/** 提示实现可替换，拦截器只调用 notifyError */
export type ErrorNotifier = (errorMessage: string) => void;

const defaultNotifier: ErrorNotifier = (errorMessage) => {
  message.error(errorMessage);
};

let notify: ErrorNotifier = defaultNotifier;

export const setErrorNotifier = (notifier: ErrorNotifier) => {
  notify = notifier;
};

export const resetErrorNotifier = () => {
  notify = defaultNotifier;
};

export const notifyError = (errorMessage: string) => {
  notify(errorMessage);
};
