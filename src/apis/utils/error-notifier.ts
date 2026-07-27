import { message } from 'antd';

/** 错误提示出口；业务方可替换为自有 Toast / 埋点，避免拦截器直接依赖 UI 库 */
export type ErrorNotifier = (errorMessage: string) => void;

const defaultNotifier: ErrorNotifier = (errorMessage) => {
  message.error(errorMessage);
};

let activeNotifier: ErrorNotifier = defaultNotifier;

/** 替换默认错误提示实现；传入 default 行为可用 resetErrorNotifier 恢复 */
export const setErrorNotifier = (notifier: ErrorNotifier) => {
  activeNotifier = notifier;
};

/** 恢复为默认 antd message.error */
export const resetErrorNotifier = () => {
  activeNotifier = defaultNotifier;
};

export const notifyError = (errorMessage: string) => {
  activeNotifier(errorMessage);
};
