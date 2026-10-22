import path from 'node:path';

/*
 * ls-lint 与 zhlint 只在收到相对路径时才真正校验，拿到绝对路径会直接放行，
 * 而 lint-staged 默认传的就是绝对路径 —— 不改写参数就会得到「钩子在跑、其实什么都没查」的假象。
 * 字符串形式的命令无法改写参数，只有函数形态可以，故用 JS 配置而非 package.json 字段。
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
  '*.{ts,tsx,js,mjs}': ['prettier --write', 'eslint --fix'],
  '*.{scss,css}': ['stylelint --fix', 'prettier --write'],
  '*.md': buildMarkdownCommands,
  '*.{json,yml,yaml}': ['prettier --write'],
};
