export interface Swappable<T> {
  get: () => T;
  set: (impl: T) => void;
  reset: () => void;
}

/**
 * 可替换实现槽：默认实现由本层给出，业务侧按需换成自己的。
 * 收敛这个模式而不是各模块各写一份 `let active` + set + reset，
 * 是为了让「覆盖时告警」「生产禁止覆盖」这类演进只改一处。
 */
export const createSwappable = <T>(defaultImpl: T): Swappable<T> => {
  let active = defaultImpl;

  return {
    get: () => active,
    set: (impl: T) => {
      active = impl;
    },
    reset: () => {
      active = defaultImpl;
    },
  };
};
