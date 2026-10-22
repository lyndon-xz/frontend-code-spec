/** import-path-boundary 的 srcDir 默认值与各 config 的 src glob 共用此值，避免口径不一致 */
export const DEFAULT_SRC_DIR = 'src';

/**
 * 只对 src 源码生效的规则共用这组 glob。
 * 规则的路径推断（srcDir）与规则的生效范围必须指同一个目录才成立，
 * 故由 DEFAULT_SRC_DIR 派生而不在各 config 里裸写 'src/**'。
 */
export const SRC_FILE_GLOBS = [`${DEFAULT_SRC_DIR}/**/*.ts`, `${DEFAULT_SRC_DIR}/**/*.tsx`];
