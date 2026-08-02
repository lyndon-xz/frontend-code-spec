import path from 'path';

/*
 * 配置从 package.json 挪到这里的原因：ls-lint 与 zhlint 都只在收到相对路径时才真正生效，
 * 而 lint-staged 默认传绝对路径 —— 两者此时都直接以 0 退出（zhlint 还会先抛 RangeError），
 * 于是校验静默失效：钩子看着在跑，实际什么都没检查。
 * package.json 里的字符串命令无法做路径转换，只有函数形态能改写参数，故改用 JS 配置。
 */

// 参数统一加引号，避免路径含空格时被拆成多个参数
const quote = (filename) => JSON.stringify(path.relative(process.cwd(), filename));

const buildFilenameCommands = (filenames) => [`ls-lint ${filenames.map(quote).join(' ')}`];

// zhlint 的 CLI 只读取第一个路径参数，多文件必须拆成多条命令，否则只有第一个被检查
const buildMarkdownCommands = (filenames) => [
  ...filenames.map((filename) => `zhlint --fix ${quote(filename)}`),
  `prettier --write ${filenames.map(quote).join(' ')}`,
];

export default {
  '{src,eslint}/**/*': buildFilenameCommands,
  'package.json': ['sort-package-json'],
  '*.{ts,tsx,js,mjs}': ['eslint --fix'],
  '*.scss': ['stylelint --fix', 'prettier --write'],
  '*.md': buildMarkdownCommands,
  '*.{json,yml,yaml}': ['prettier --write'],
};
