import eslintReact from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';

const TS_FILES = ['**/*.ts', '**/*.tsx'];

// 预设里的 warn 不会让 CI 失败，本仓只有一档：要么不开，要么必须改
const toErrorLevel = (rules) =>
  Object.fromEntries(
    Object.entries(rules).map((entry) => {
      const [name, level] = entry;

      return [name, level === 'warn' ? 'error' : level];
    }),
  );

/*
 * @eslint-react 的推荐集里有一批与 react-hooks 同名的规则，两边都开会对同一处报两次。
 * react-hooks 是 React 官方实现，保留它；对应关系取自 @eslint-react 自带的冲突清单。
 */
const hooksDuplicates = Object.fromEntries(
  Object.keys(eslintReact.configs['disable-conflict-eslint-plugin-react-hooks'].rules).map(
    (name) => [name.replace(/^react-hooks\//, '@eslint-react/'), 'off'],
  ),
);

const eslintReactPreset = eslintReact.configs['recommended-type-checked'];

export default [
  {
    files: TS_FILES,
    settings: eslintReactPreset.settings,
    rules: {
      ...toErrorLevel(reactHooks.configs.flat['recommended-latest'].rules),
      ...toErrorLevel(eslintReactPreset.rules),
      ...hooksDuplicates,
    },
  },
  {
    files: ['**/*.tsx'],
    rules: {
      'custom/no-unnecessary-arrow-wrapper': 'error',
      'custom/props-interface-naming': 'error',
    },
  },
];
