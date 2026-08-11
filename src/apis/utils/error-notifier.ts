import { message } from 'antd';

/** 提示实现可替换，避免拦截器直接依赖 UI 库 */
export type ErrorNotifier = (errorMessage: string) => void;

const defaultNotifier: ErrorNotifier = (errorMessage) => {
  message.error(errorMessage);
};

let activeNotifier: ErrorNotifier = defaultNotifier;

export const setErrorNotifier = (notifier: ErrorNotifier) => {
  activeNotifier = notifier;
};

export const resetErrorNotifier = () => {
  activeNotifier = defaultNotifier;
};

export const notifyError = (errorMessage: string) => {
  activeNotifier(errorMessage);
};
