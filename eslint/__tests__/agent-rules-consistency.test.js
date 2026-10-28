import fs from 'node:fs';
import path from 'node:path';

import { ESLint } from 'eslint';
import { builtinRules } from 'eslint/use-at-your-own-risk';
import stylelint from 'stylelint';
import ts from 'typescript';
import { beforeAll, describe, expect, it } from 'vitest';

import plugin from '../index.js';

const root = path.resolve(import.meta.dirname, '../..');
const rulesDir = path.join(root, '.agents/rules');

const SAMPLES = {
  js: ['eslint/index.js'],
  ts: ['src/apis/request.ts'],
  tsx: ['src/components/flight-card/index.tsx'],
  src: ['src/apis/request.ts', 'src/components/flight-card/index.tsx'],
  test: ['src/apis/__tests__/request.test.ts'],
};

const INDEX_ORDER = [
  'structure.md',
  'functions.md',
  'naming.md',
  'comments.md',
  'writes.md',
  'typescript.md',
  'react.md',
  'style.md',
];

const TITLE_FORBIDDEN = /禁止|不许|不得|不要|严禁|不准|避免|切勿/;
const DESCRIPTION_BAD_START = /^['"[{*&!|>#@`%]/;
const DESCRIPTION_BAD_INNER = /: | #/;

const REVIEW_VOICE =
  /🔴|🟡|🔵|^\s*(?:#{2,}\s*|\*\*)检测(?:\*\*)?\s*[：:]?|写进报告|报告[里中]|审查流程|档位|不阻塞|可选(?![链参属字])/m;

/** @type {Map<string, { rules: Record<string, unknown>, plugins: Record<string, { rules?: Record<string, unknown> }> }>} */
const configs = new Map();

/** @type {Record<string, unknown>} */
let stylelintConfig = {};

/** @type {Record<string, unknown>} */
let tsOptions = {};

/** @type {Set<string>} */
let eslintRuleIds = new Set();

/** @type {Map<string, Set<string>>} */
let pluginRuleNames = new Map();

/** @type {Set<string>} */
let stylelintRuleIds = new Set();

/** @type {Set<string>} */
let tsOptionNames = new Set();

beforeAll(async () => {
  const eslint = new ESLint({ cwd: root });
  const files = [...new Set(Object.values(SAMPLES).flat())];

  for (const file of files) {
    configs.set(file, await eslint.calculateConfigForFile(file));
  }

  stylelintConfig = (await stylelint.resolveConfig(path.join(root, 'src/probe.module.scss'))) ?? {};

  const configFile = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
  tsOptions = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root).options;
  tsOptionNames = new Set(ts.optionDeclarations.map((item) => item.name));

  eslintRuleIds = new Set(builtinRules.keys());
  pluginRuleNames = new Map();

  for (const config of configs.values()) {
    for (const [prefix, pluginObject] of Object.entries(config.plugins ?? {})) {
      const names = new Set(Object.keys(pluginObject.rules ?? {}));
      const previous = pluginRuleNames.get(prefix) ?? new Set();

      for (const name of names) {
        previous.add(name);
        eslintRuleIds.add(`${prefix}/${name}`);
      }

      pluginRuleNames.set(prefix, previous);
    }
  }

  stylelintRuleIds = new Set([
    ...Object.keys(stylelint.rules ?? {}),
    ...Object.keys(stylelintConfig.rules ?? {}),
  ]);
});

function ruleFiles() {
  return fs
    .readdirSync(rulesDir)
    .filter((name) => name.endsWith('.md'))
    .sort();
}

function readRule(name) {
  return fs.readFileSync(path.join(rulesDir, name), 'utf8');
}

function failJoin(failures) {
  expect(failures).toEqual([]);
}

function isErrorSeverity(value) {
  if (value === 2 || value === 'error') {
    return true;
  }

  return Array.isArray(value) && (value[0] === 2 || value[0] === 'error');
}

function parseTable(section) {
  const rows = [];

  for (const line of section.split('\n')) {
    if (!line.startsWith('|')) {
      continue;
    }

    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());

    if (cells.length === 0 || cells.every((cell) => /^:?-+:?$/.test(cell))) {
      continue;
    }

    rows.push(cells);
  }

  return rows;
}

function enabledIds() {
  const ids = new Set();

  for (const config of configs.values()) {
    for (const [id, severity] of Object.entries(config.rules ?? {})) {
      if (isErrorSeverity(severity)) {
        ids.add(id);
      }
    }
  }

  for (const [id, value] of Object.entries(stylelintConfig.rules ?? {})) {
    if (value != null) {
      ids.add(id);
    }
  }

  for (const [name, value] of Object.entries(tsOptions)) {
    if (value === true) {
      ids.add(`tsconfig:${name}`);
    }
  }

  return ids;
}

function fileTitle(text) {
  const heading = text.split('\n').find((line) => line.startsWith('# ') && !line.startsWith('## '));

  return heading?.slice(2) ?? '';
}

function frontmatterEnd(name, lines) {
  if (lines[0] !== '---') {
    return { failures: [`${name}:1 首行不是 ---`], end: -1 };
  }

  const end = lines.indexOf('---', 1);

  if (end < 0) {
    return { failures: [`${name}:1 frontmatter 没有结束行`], end: -1 };
  }

  return { failures: [], end };
}

function readDescription(name, block) {
  if (block.length === 0 || !block[0].startsWith('description: ')) {
    return { failures: [`${name}:2 缺少单行 description`], value: '', nextIndex: 0 };
  }

  const value = block[0].slice('description: '.length);
  const failures = [];

  if (DESCRIPTION_BAD_START.test(value) || DESCRIPTION_BAD_INNER.test(value)) {
    failures.push(`${name}:2 description 不是普通标量`);
  }

  return { failures, value, nextIndex: 1 };
}

function readPaths(name, block, index) {
  if (index >= block.length || block[index] !== 'paths:') {
    return { failures: [], value: [], nextIndex: index };
  }

  const failures = [];
  const value = [];
  let cursor = index + 1;

  if (cursor >= block.length) {
    failures.push(`${name} paths 至少要有一行 glob`);
  }

  while (cursor < block.length) {
    const matched = /^ {2}- '([^']*)'$/.exec(block[cursor]);

    if (!matched) {
      failures.push(`${name}:${cursor + 2} paths 行不符合两个空格加单引号 glob`);
      break;
    }

    value.push(matched[1]);
    cursor += 1;
  }

  return { failures, value, nextIndex: cursor };
}

function blankFrontmatterLines(name, block) {
  const failures = [];

  for (const [lineIndex, line] of block.entries()) {
    if (line === '' || line.trimStart().startsWith('#')) {
      failures.push(`${name}:${lineIndex + 2} frontmatter 含空行或注释`);
    }
  }

  return failures;
}

function parseFrontmatter(name, text) {
  const lines = text.split('\n');
  const opened = frontmatterEnd(name, lines);

  if (opened.end < 0) {
    return { failures: opened.failures, description: '', paths: [] };
  }

  const block = lines.slice(1, opened.end);
  const description = readDescription(name, block);
  const paths = readPaths(name, block, description.nextIndex);
  const failures = [...description.failures, ...paths.failures];

  if (paths.nextIndex !== block.length) {
    failures.push(`${name} frontmatter 含 description 与 paths 以外的内容`);
  }

  failures.push(...blankFrontmatterLines(name, block));

  return { failures, description: description.value, paths: paths.value };
}

function applicableCell(paths) {
  if (paths.length === 0) {
    return '通用';
  }

  return paths.map((item) => `\`${item}\``).join('、');
}

function codeBlocks(section) {
  const blocks = [];
  const pattern = /```[^\n]*\n([\s\S]*?)```/g;

  for (const matched of section.matchAll(pattern)) {
    blocks.push(matched[1]);
  }

  return blocks;
}

function proseLines(text) {
  const lines = [];
  let inFence = false;

  for (const [index, line] of text.split('\n').entries()) {
    if (line.startsWith('```')) {
      inFence = !inFence;
      continue;
    }

    if (!inFence) {
      lines.push({ line, number: index + 1 });
    }
  }

  return lines;
}

function ruleSections(name, text) {
  const lines = text.split('\n');
  const starts = [];

  for (const [index, line] of lines.entries()) {
    if (/^## \d+、/.test(line)) {
      starts.push(index);
    }
  }

  return starts.map((start, index) => {
    const end = starts[index + 1] ?? lines.length;
    let stop = end;

    for (let cursor = start + 1; cursor < end; cursor += 1) {
      if (lines[cursor].startsWith('## ')) {
        stop = cursor;
        break;
      }
    }

    return {
      name,
      line: start + 1,
      heading: lines[start],
      body: lines.slice(start, stop).join('\n'),
    };
  });
}

function registeredNames() {
  const entry = plugin.find((item) => item.plugins?.custom);

  return Object.keys(entry.plugins.custom.rules);
}

function readmeRuleRows() {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const rows = parseTable(readme);
  const headerIndex = rows.findIndex((cells) => cells.includes('社区版缺什么'));
  const header = rows[headerIndex];
  const column = header.indexOf('社区版缺什么');
  const body = [];

  for (const cells of rows.slice(headerIndex + 1)) {
    if (cells.length !== header.length) {
      break;
    }

    body.push(cells);
  }

  return { readme, column, body };
}

function numberingFailures(name, seen) {
  const text = readRule(name);
  const parsed = parseFrontmatter(name, text);
  const failures = [...parsed.failures, ...headingFailures(name, text, parsed.description)];
  const state = { expectedNumber: 1, seen };

  for (const section of ruleSections(name, text)) {
    failures.push(...sectionNumberFailures(name, section, state));
  }

  return failures;
}

function headingFailures(name, text, description) {
  const failures = [];
  const title = fileTitle(text);

  if (title === '') {
    failures.push(`${name} 缺少一级标题`);
  }

  if (description !== '' && description === title) {
    failures.push(`${name} 的 description 与一级标题相同，应说明这份规则负责什么`);
  }

  return failures;
}

function sectionNumberFailures(name, section, state) {
  const matched = /^## (\d+)、(.+)$/.exec(section.heading);

  if (!matched) {
    return [`${name}:${section.line} 标题不是 ## 序号、陈述`];
  }

  const failures = [];

  if (Number(matched[1]) !== state.expectedNumber) {
    failures.push(`${name}:${section.line} 序号应为 ${state.expectedNumber}`);
  }

  state.expectedNumber += 1;
  const previous = state.seen.get(matched[2]);

  if (previous) {
    failures.push(`${matched[2]} 同时出现在 ${previous} 与 ${name}:${section.line}`);
  }

  state.seen.set(matched[2], `${name}:${section.line}`);

  return failures;
}

function sectionShapeFailures(name, section) {
  const title = /^## \d+、(.+)$/.exec(section.heading);

  if (!title) {
    return [`${name}:${section.line} 标题不是 ## 序号、陈述`];
  }

  const failures = [];

  if (TITLE_FORBIDDEN.test(title[1])) {
    failures.push(`${name}:${section.line} 标题含禁止式措辞`);
  }

  failures.push(...whyLineFailures(name, section), ...exampleMarkFailures(name, section));

  if (!section.body.split('\n').some((line) => line.startsWith('边界：'))) {
    failures.push(`${name}:${section.line} 缺少边界`);
  }

  return failures;
}

function whyLineFailures(name, section) {
  const content = section.body.split('\n').slice(1);
  const first = content.find((line) => line.trim() !== '');

  if (first?.startsWith('过渡：')) {
    const after = content.slice(content.indexOf(first) + 1).find((line) => line.trim() !== '');

    if (!after?.startsWith('为什么：')) {
      return [`${name}:${section.line} 过渡行之后不是为什么`];
    }

    return [];
  }

  if (!first?.startsWith('为什么：')) {
    return [`${name}:${section.line} 标题后第一行不是为什么或过渡`];
  }

  return [];
}

function exampleMarkFailures(name, section) {
  const failures = [];
  const blocks = codeBlocks(section.body);
  const firstLine = blocks[0]?.split('\n').find((line) => line.trim() !== '');

  if (!firstLine?.includes('✅')) {
    failures.push(`${name}:${section.line} 第一个代码块的首个非空行没有 ✅`);
  }

  failures.push(...wrongMarkFailures(name, section, blocks));

  return failures;
}

function wrongMarkFailures(name, section, blocks) {
  const wrongLines = section.body.split('\n').filter((line) => line.includes('❌'));

  if (wrongLines.length > 1) {
    return [`${name}:${section.line} ❌ 超过一行`];
  }

  if (wrongLines.length !== 1) {
    return [];
  }

  const fence = blocks.find((block) => block.includes('❌'));
  const okAt = fence?.indexOf('✅') ?? -1;
  const badAt = fence?.indexOf('❌') ?? -1;

  if (okAt < 0 || badAt < okAt) {
    return [`${name}:${section.line} ❌ 不在 ✅ 之后的同一代码块`];
  }

  return [];
}

describe('开发规则与工具配置对账', () => {
  it('注册的 custom 规则在源码样本上是 error', () => {
    const failures = [];

    for (const name of registeredNames()) {
      const id = `custom/${name}`;
      const covered = ['js', 'ts', 'tsx', 'src'].some((scope) =>
        SAMPLES[scope].some((file) => isErrorSeverity(configs.get(file).rules[id])),
      );

      if (!covered) {
        failures.push(`${id} 没有在源码样本上设为 error`);
      }
    }

    failJoin(failures);
  });

  it('README 的自研规则表、条数与分组数跟注册结果一致', () => {
    const registered = registeredNames();
    const { readme, column, body } = readmeRuleRows();
    const names = body.map((cells) => cells[0].replaceAll('`', ''));
    const failures = [];

    for (const name of registered) {
      if (!names.includes(name)) {
        failures.push(`README 缺少自研规则 ${name}`);
      }
    }

    for (const name of names) {
      if (!registered.includes(name)) {
        failures.push(`README 多了自研规则 ${name}`);
      }
    }

    for (const cells of body) {
      if (cells[column].trim() === '') {
        failures.push(`${cells[0]} 的社区版缺什么为空`);
      }
    }

    const configCount = fs
      .readdirSync(path.join(root, 'eslint/configs'))
      .filter((name) => name.endsWith('.js')).length;

    for (const matched of readme.matchAll(/(\d+) 条[^，。\n]{0,8}规则/g)) {
      if (Number(matched[1]) !== registered.length) {
        failures.push(`README「${matched[0]}」应为 ${registered.length}`);
      }
    }

    for (const matched of readme.matchAll(/(\d+) 组/g)) {
      if (Number(matched[1]) !== configCount) {
        failures.push(`README「${matched[0]}」应为 ${configCount}`);
      }
    }

    failJoin(failures);
  });

  it('description 说明这份规则负责什么，规则从 1 连续编号', () => {
    const seen = new Map();
    const failures = ruleFiles().flatMap((name) => numberingFailures(name, seen));

    failJoin(failures);
  });

  it('AGENTS.md 索引与 frontmatter 逐字一致', () => {
    const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
    const section = agents.split('## 开发规则')[1] ?? '';
    const rows = parseTable(section).slice(1);
    const failures = [];
    const linked = [];

    const files = ruleFiles();
    const missing = INDEX_ORDER.filter((name) => !files.includes(name));
    const extra = files.filter((name) => !INDEX_ORDER.includes(name));

    if (missing.length > 0 || extra.length > 0) {
      failures.push(`规则文件缺少 ${missing.join('、')}，多出 ${extra.join('、')}`);
    }

    for (const cells of rows) {
      const href = /\(([^)]+)\)/.exec(cells[0])?.[1] ?? '';
      const filename = href.replace('.agents/rules/', '');
      linked.push(filename);

      const parsed = parseFrontmatter(filename, readRule(filename));

      if (href !== `.agents/rules/${filename}`) {
        failures.push(`${filename} 链接目标不是 .agents/rules/${filename}`);
      }

      if (cells[1] !== applicableCell(parsed.paths)) {
        failures.push(`${filename} 适用文件应为 ${applicableCell(parsed.paths)}，实际 ${cells[1]}`);
      }

      if (cells[2] !== parsed.description) {
        failures.push(`${filename} 管什么应为 ${parsed.description}，实际 ${cells[2]}`);
      }
    }

    if (linked.join() !== INDEX_ORDER.join()) {
      failures.push(`索引行顺序应为 ${INDEX_ORDER.join('、')}`);
    }

    failJoin(failures);
  });

  it('规则总行数不超过 2350', () => {
    const total = ruleFiles().reduce((sum, name) => sum + readRule(name).split('\n').length - 1, 0);

    console.info(
      `规则总行数 ${total}，相对 4700 为 ${(total / 4700).toFixed(2)}，相对 2899 为 ${(total / 2899).toFixed(2)}`,
    );
    expect(total).toBeLessThanOrEqual(2350);
  });

  it('列出过渡规则', () => {
    const found = [];

    for (const name of ruleFiles()) {
      for (const [index, line] of readRule(name).split('\n').entries()) {
        if (line.startsWith('过渡：')) {
          found.push(`${name}:${index + 1} ${line}`);
        }
      }
    }

    console.info(found.length === 0 ? '没有过渡规则' : found.join('\n'));
    expect(found).toEqual([]);
  });

  it('每条规则的标题、理由、示例与边界齐全', () => {
    const failures = ruleFiles().flatMap((name) =>
      ruleSections(name, readRule(name)).flatMap((section) => sectionShapeFailures(name, section)),
    );

    failJoin(failures);
  });

  it('规则正文不含审查专用措辞', () => {
    const failures = [];

    for (const name of ruleFiles()) {
      for (const [index, line] of readRule(name).split('\n').entries()) {
        const matched = REVIEW_VOICE.exec(line);

        if (matched) {
          failures.push(`${name}:${index + 1} 命中 ${matched[0]}`);
        }
      }
    }

    failJoin(failures);
  });

  it('正文引用的工具规则都已登记', () => {
    const ids = enabledIds();
    const failures = [];

    for (const name of ruleFiles()) {
      for (const { line, number } of proseLines(readRule(name))) {
        for (const matched of line.matchAll(/`([^`\n]+)`/g)) {
          const token = matched[1];
          const problem = referencedRuleProblem(token, ids);

          if (problem) {
            failures.push(`${name}:${number} ${problem}：${token}`);
          }
        }
      }
    }

    failJoin(failures);
  });
});

function referencedRuleProblem(token, ids) {
  if (token.startsWith('tsconfig:')) {
    const option = token.slice('tsconfig:'.length);

    if (!tsOptionNames.has(option)) {
      return '不是 TS 编译选项';
    }

    if (!ids.has(token)) {
      return '未在校验里启用';
    }

    return '';
  }

  if (tsOptionNames.has(token)) {
    return 'TS 编译选项写成 tsconfig:' + token;
  }

  if (eslintRuleIds.has(token) || stylelintRuleIds.has(token)) {
    return ids.has(token) ? '' : '未在校验里启用';
  }

  for (const [prefix, names] of pluginRuleNames) {
    const head = `${prefix}/`;

    const ruleName = token.slice(head.length);

    if (ruleName !== '' && token.startsWith(head) && !names.has(ruleName)) {
      return '引用了不存在的规则';
    }
  }

  return '';
}
