import eslintReact from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';

import {
  COMPONENT_FILE_GLOBS,
  SCRIPT_FILE_GLOBS,
  TS_FILE_GLOBS,
} from '../constants/source-globs.js';
import { toErrorLevel } from '../utils/error-level.js';

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
    files: SCRIPT_FILE_GLOBS,
    settings: eslintReactPreset.settings,
    rules: toErrorLevel(reactHooks.configs.flat['recommended-latest'].rules),
  },
  {
    // recommended-type-checked 要类型信息，JS / JSX 跑不了
    files: TS_FILE_GLOBS,
    settings: eslintReactPreset.settings,
    rules: {
      ...toErrorLevel(eslintReactPreset.rules),
      ...hooksDuplicates,
    },
  },
  {
    files: COMPONENT_FILE_GLOBS,
    rules: {
      'custom/no-unnecessary-arrow-wrapper': 'error',
    },
  },
  {
    // props 接口只存在于 TSX
    files: ['**/*.tsx'],
    rules: {
      'custom/props-interface-naming': 'error',
    },
  },
];
