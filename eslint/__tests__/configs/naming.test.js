import tseslint from 'typescript-eslint';
import { afterAll, describe, expect, it } from 'vitest';

import namingConfig from '../../configs/naming.js';
import { createTypedLinter } from '../support/typed-linter.js';

const typedLinter = createTypedLinter();

// 只取 naming-convention 所在的 TS 块，其余块依赖 custom 插件与 check-file
const config = [
  { plugins: { '@typescript-eslint': tseslint.plugin } },
  ...namingConfig.filter((block) => block.rules?.['@typescript-eslint/naming-convention']),
];

let fileSeq = 0;
const lintNaming = (code) => {
  fileSeq += 1;

  return typedLinter
    .lint(code, { filename: `src/naming-${fileSeq}.ts`, config })
    .filter((message) => message.ruleId === '@typescript-eslint/naming-convention');
};

afterAll(() => {
  typedLinter.cleanup();
});

describe('naming-convention：既有约束仍生效', () => {
  it('数组变量带 Array 后缀时报', () => {
    expect(lintNaming('export const itemsArray: string[] = [];')).toHaveLength(1);
  });

  it('布尔类型字段缺少 is 一类前缀时报', () => {
    expect(lintNaming('export interface Flags {\n  loading: boolean;\n}')).toHaveLength(1);
  });
});

describe('naming-convention：合并进来的新约束', () => {
  it('数组变量与数组字段带 List 后缀时报', () => {
    expect(lintNaming('export const itemList: string[] = [];')).toHaveLength(1);
    expect(lintNaming('export interface Page {\n  hotelList: string[];\n}')).toHaveLength(1);
  });

  it('布尔变量与布尔字段在前缀之后接 Not 时报', () => {
    expect(lintNaming('export const isNotReady: boolean = false;')).toHaveLength(1);
    expect(lintNaming('export interface Flags {\n  isNotVisible: boolean;\n}')).toHaveLength(1);
  });

  it('布尔参数缺少前缀时报', () => {
    expect(
      lintNaming('export function toggle(visible: boolean): boolean {\n  return !visible;\n}'),
    ).toHaveLength(1);
  });

  it('布尔类属性缺少前缀时报', () => {
    expect(lintNaming('export class Dialog {\n  open = false;\n}')).toHaveLength(1);
  });
});

describe('naming-convention：豁免与合规写法不报', () => {
  it('解构出的布尔变量不校验前缀', () => {
    expect(
      lintNaming('const props = { loading: true };\nexport const { loading } = props;'),
    ).toEqual([]);
  });

  it('解构出的布尔参数不校验前缀', () => {
    expect(
      lintNaming(
        "export function show(options: Record<'visible', boolean>): boolean {\n  const { visible } = options;\n  return visible;\n}\nexport const render = ({ visible }: Record<'visible', boolean>): boolean => visible;",
      ),
    ).toEqual([]);
  });

  it('前缀之后的 Not 只在整词时报，hasNotification 放行', () => {
    expect(lintNaming('export interface Flags {\n  hasNotification: boolean;\n}')).toEqual([]);
  });

  it('带前缀的布尔参数与类属性不报', () => {
    expect(
      lintNaming(
        'export class Dialog {\n  isOpen = false;\n}\nexport const toggle = (isVisible: boolean): boolean => !isVisible;',
      ),
    ).toEqual([]);
  });
});
