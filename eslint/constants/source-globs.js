/** import-path-boundary 的 srcDir 默认值与各 config 的 src glob 共用此值，避免口径不一致 */
export const DEFAULT_SRC_DIR = 'src';

const SOURCE_EXTENSIONS = ['js', 'jsx', 'ts', 'tsx'];

const fileGlobs = (extensions, directory) =>
  extensions.map((extension) =>
    directory === undefined ? `**/*.${extension}` : `${directory}/**/*.${extension}`,
  );

/** 不依赖类型信息的规则：JS、JSX 与 TS 同一套 */
export const SCRIPT_FILE_GLOBS = fileGlobs(SOURCE_EXTENSIONS);

/** 没有类型信息的脚本。no-shadow 等核心规则只挂这里，TS 用对应的 typescript-eslint 规则 */
export const JS_FILE_GLOBS = fileGlobs(['js', 'jsx']);

/** 含 JSX 的文件。可访问性、多余箭头、innerHTML 只在这里有意义 */
export const JSX_FILE_GLOBS = fileGlobs(['jsx', 'tsx']);

/** src 下的 .js 同样可以写 JSX，和 jsx / tsx 一起交给组件规则 */
export const COMPONENT_FILE_GLOBS = [...JSX_FILE_GLOBS, `${DEFAULT_SRC_DIR}/**/*.js`];

/** 类型规则只对 TS 成立 */
export const TS_FILE_GLOBS = fileGlobs(['ts', 'tsx']);

/**
 * 只对 src 源码生效的规则共用这组 glob。
 * 规则的路径推断（srcDir）与规则的生效范围必须指同一个目录才成立，
 * 故由 DEFAULT_SRC_DIR 派生而不在各 config 里裸写 'src/**'。
 * 四种后缀都算源码：模块边界、文件名和 ref 后缀不依赖类型。
 */
export const SRC_FILE_GLOBS = fileGlobs(SOURCE_EXTENSIONS, DEFAULT_SRC_DIR);
