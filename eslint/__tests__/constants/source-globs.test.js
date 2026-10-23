import { describe, expect, it } from 'vitest';

import {
  COMPONENT_FILE_GLOBS,
  JS_FILE_GLOBS,
  JSX_FILE_GLOBS,
  SCRIPT_FILE_GLOBS,
  SRC_FILE_GLOBS,
  TS_FILE_GLOBS,
} from '../../constants/source-globs.js';

describe('source-globs', () => {
  it('四种后缀都算脚本，类型检查与组件规则各取其中一部分', () => {
    expect(SCRIPT_FILE_GLOBS).toEqual(['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx']);
    expect(JS_FILE_GLOBS).toEqual(['**/*.js', '**/*.jsx']);
    expect(JSX_FILE_GLOBS).toEqual(['**/*.jsx', '**/*.tsx']);
    expect(TS_FILE_GLOBS).toEqual(['**/*.ts', '**/*.tsx']);
    expect(SRC_FILE_GLOBS).toEqual(['src/**/*.js', 'src/**/*.jsx', 'src/**/*.ts', 'src/**/*.tsx']);
    expect(COMPONENT_FILE_GLOBS).toEqual(['**/*.jsx', '**/*.tsx', 'src/**/*.js']);
  });
});
