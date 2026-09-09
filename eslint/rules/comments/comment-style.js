function isWithinExportDeclaration(node) {
  let current = node;
  while (current) {
    if (current.type === 'ExportNamedDeclaration' || current.type === 'ExportDefaultDeclaration') {
      return true;
    }
    /*
     * 遇到函数体 / 对象体 / 类体 / 顶层即停止追溯，内部注释不被上层 export 语义传染；
     * ClassBody 与 ObjectExpression 成对出现，保证导出类与导出对象的成员注释判定一致。
     */
    if (
      current.type === 'FunctionDeclaration' ||
      current.type === 'FunctionExpression' ||
      current.type === 'ArrowFunctionExpression' ||
      current.type === 'ObjectExpression' ||
      current.type === 'ClassBody' ||
      current.type === 'Program'
    ) {
      break;
    }
    current = current.parent;
  }
  return false;
}

// 行首是语句关键字：import x from 'y'、if (a) 之类
const CODE_KEYWORD_LINE_START =
  /^(import|export|const|let|var|function|async|await|class|interface|type|enum|namespace|return|if|else|for|while|do|switch|case|break|continue|throw|new|delete|yield|console|window|document)\b/;

// 行首是标识符（含成员访问）紧接调用或赋值：foo()、a.b = 1；=[^=] 排除 == 比较
const CALL_OR_ASSIGN_LINE_START = /^[A-Za-z_$][\w$.]*\s*(\(|=[^=])/;

// 行尾是语句或块的收尾符号：; { }
const CODE_LINE_END = /[;{}]\s*$/;

// 只按行首、行尾形态判断，避免把含 () / => 的中文散文误判为被注释掉的代码
function looksLikeCommentedCode(text) {
  return (
    CODE_KEYWORD_LINE_START.test(text) ||
    CALL_OR_ASSIGN_LINE_START.test(text) ||
    CODE_LINE_END.test(text)
  );
}

// 剥掉每行的 `*` 前缀后压成一行：调用处要拿它拼单行注释，或作为合并块注释的一行
function flattenBlockCommentText(blockCommentValue) {
  return blockCommentValue
    .split('\n')
    .map((line) => line.trim().replace(/^\*+\s*/, ''))
    .filter(Boolean)
    .join(' ');
}

// 判据是 comment.value 的首字符为 *，不可 trim：否则每行带 ` * ` 前缀的普通块注释会被误判为 JSDoc
function isJsdocBlock(comment) {
  return comment.type === 'Block' && comment.value.startsWith('*');
}

function isSkippableComment(comment) {
  const text = comment.value.trim();
  if (text.startsWith('eslint-') || text.startsWith('prettier-') || text.startsWith('@ts-')) {
    return true;
  }
  if (comment.type === 'Line' && /^\/\s*</.test(text)) {
    return true;
  }
  // 含 @ 标签的块注释视为约定文档
  if (isJsdocBlock(comment) && text.includes('@')) {
    return true;
  }
  if (comment.type === 'Line' && looksLikeCommentedCode(text)) {
    return true;
  }
  return false;
}

// 只用于注释与前驱 token 同行的情形，故 tokenBefore 必然存在
function buildMoveAboveFix(sourceCode, comment, tokenBefore) {
  return (fixer) => {
    const { text } = sourceCode;
    const commentText = text.slice(comment.range[0], comment.range[1]);
    const lineStart = sourceCode.getIndexFromLoc({ line: comment.loc.start.line, column: 0 });
    const indent = text.slice(lineStart, tokenBefore.range[0]).match(/^[ \t]*/)[0];
    const trailingSpaces = text.slice(tokenBefore.range[1], comment.range[0]).match(/[ \t]+$/);
    const spacesToRemove = trailingSpaces ? trailingSpaces[0].length : 0;
    return [
      fixer.insertTextBeforeRange([lineStart, lineStart], `${commentText}\n${indent}`),
      fixer.removeRange([comment.range[0] - spacesToRemove, comment.range[1]]),
    ];
  };
}

// 成组的判据：逐条行相邻，且共享同一后继代码 token
function collectAdjacentCommentGroup(scanContext) {
  const { sourceCode, comments, startIdx, tokenAfter } = scanContext;
  const group = [comments[startIdx]];
  for (let j = startIdx + 1; j < comments.length; j++) {
    const next = comments[j];
    const prev = group[group.length - 1];
    if (isSkippableComment(next)) {
      break;
    }
    if (next.loc.start.line !== prev.loc.end.line + 1) {
      break;
    }
    if (sourceCode.getTokenAfter(next, { includeComments: false }) !== tokenAfter) {
      break;
    }
    group.push(next);
  }
  return group;
}

/*
 * 与下一个声明之间空了一行的注释不是那个声明的文档注释：文件顶部讲整个模块在做什么
 * 的说明就是这种形态，它后面往往还隔着别的注释与 import。不断开归属的话，模块说明会
 * 被要求写成紧随其后那个 export 的 JSDoc，语义就错位了。断开后按非导出位置判形态。
 *
 * 比的是这组注释末条与声明的行距，不是当前这条：多段堆叠的注释之间没有空行，
 * 拿第一条去比会把「中间还有别的注释」当成「隔了空行」。
 */
function isAttachedTo(tokenAfter, lastInGroup) {
  return tokenAfter === null || tokenAfter.loc.start.line <= lastInGroup.loc.end.line + 1;
}

function extractCommentLines(group) {
  return group.map((comment) =>
    comment.type === 'Block' ? flattenBlockCommentText(comment.value) : comment.value.trim(),
  );
}

// 含 `*/` 时不能包进块注释：会提前闭合而产生语法错误，转义则改动了注释文字，故放弃自动修复
function canWrapInBlockComment(text) {
  return !text.includes('*/');
}

function buildMergedComment(group, opener) {
  const indent = ' '.repeat(group[0].loc.start.column);
  const lines = extractCommentLines(group);
  return `${opener}\n${lines.map((line) => `${indent} * ${line}`).join('\n')}\n${indent} */`;
}

/** 优先级：先放行指令 / 被注释掉的代码 / 内联参数注释，再判位置，最后判风格 */
export default {
  meta: {
    type: 'layout',
    docs: {
      description:
        '根据导出语义强制注释风格：export 上方用 /** */，其余位置单行用 //、多行或多段堆叠用 /* */；注释须在目标代码上方独占一行',
    },
    fixable: 'code',
    schema: [],
    messages: {
      notAbove: '注释必须写在目标代码上方独占一行',
      exportNeedsJsdoc: '导出声明的注释必须使用 `/** */` 文档注释',
      exportMergeJsdoc: '导出上方的多段注释应合并为一个 `/** */` 文档注释',
      internalSingleLine: '非导出代码的单行注释必须使用 `//` 行注释',
      internalMultiLine: '非导出代码的多行注释必须使用 `/* */` 块注释（而非 JSDoc `/** */`）',
      internalMergeBlock: '非导出位置的多段注释应合并为一个 `/* */` 块注释',
    },
  },
  create(context) {
    const { sourceCode } = context;

    function reportMerge(group, isExport) {
      const first = group[0];
      const last = group[group.length - 1];
      const canFix = extractCommentLines(group).every(canWrapInBlockComment);
      context.report({
        loc: { start: first.loc.start, end: last.loc.end },
        messageId: isExport ? 'exportMergeJsdoc' : 'internalMergeBlock',
        fix: canFix
          ? (fixer) =>
              fixer.replaceTextRange(
                [first.range[0], last.range[1]],
                buildMergedComment(group, isExport ? '/**' : '/*'),
              )
          : null,
      });
    }

    /*
     * 返回是否已处理：与前后 token 同行的注释在这一档定论，编排层据此结束。
     * 内联参数注释是同行形态里唯一放行的，放行同样算已处理，不再往下判风格。
     */
    function checkNotAbove(comment, tokenBefore, tokenAfter) {
      const isSameLineBefore = tokenBefore && tokenBefore.loc.end.line === comment.loc.start.line;
      const isSameLineAfter = tokenAfter && tokenAfter.loc.start.line === comment.loc.end.line;
      if (!isSameLineBefore && !isSameLineAfter) {
        return false;
      }

      // 内联参数块注释放行：foo(/* name */ 'bar')
      if (comment.type === 'Block' && isSameLineBefore && isSameLineAfter) {
        return true;
      }

      context.report({
        loc: comment.loc,
        messageId: 'notAbove',
        // 同行后继 token 的形态无法就地搬移，只报不修
        fix: isSameLineBefore ? buildMoveAboveFix(sourceCode, comment, tokenBefore) : () => null,
      });
      return true;
    }

    function checkExportSingle(comment) {
      if (isJsdocBlock(comment)) {
        return;
      }
      const content =
        comment.type === 'Block' ? flattenBlockCommentText(comment.value) : comment.value.trim();
      context.report({
        loc: comment.loc,
        messageId: 'exportNeedsJsdoc',
        fix: canWrapInBlockComment(content)
          ? (fixer) => fixer.replaceText(comment, `/** ${content} */`)
          : null,
      });
    }

    function checkInternalSingle(comment) {
      if (comment.type !== 'Block') {
        return;
      }

      const isSingleLine = comment.loc.start.line === comment.loc.end.line;
      if (isSingleLine) {
        context.report({
          loc: comment.loc,
          messageId: 'internalSingleLine',
          fix: (fixer) =>
            fixer.replaceText(comment, `// ${flattenBlockCommentText(comment.value)}`),
        });
        return;
      }
      if (isJsdocBlock(comment)) {
        context.report({
          loc: comment.loc,
          messageId: 'internalMultiLine',
          fix: (fixer) => fixer.replaceText(comment, `/*${comment.value.replace(/^\*/, '')}*/`),
        });
      }
    }

    return {
      Program() {
        const comments = sourceCode.getAllComments();
        const visited = new Set();

        comments.forEach((comment, idx) => {
          if (visited.has(comment) || isSkippableComment(comment)) {
            return;
          }

          const tokenBefore = sourceCode.getTokenBefore(comment, { includeComments: false });
          const tokenAfter = sourceCode.getTokenAfter(comment, { includeComments: false });

          if (checkNotAbove(comment, tokenBefore, tokenAfter)) {
            return;
          }

          const group = collectAdjacentCommentGroup({
            sourceCode,
            comments,
            startIdx: idx,
            tokenAfter,
          });
          group.forEach((item) => visited.add(item));

          const isExport =
            isAttachedTo(tokenAfter, group[group.length - 1]) &&
            isWithinExportDeclaration(
              sourceCode.getNodeByRangeIndex(tokenAfter ? tokenAfter.range[0] : comment.range[1]),
            );

          if (group.length > 1) {
            reportMerge(group, isExport);
            return;
          }
          if (isExport) {
            checkExportSingle(comment);
          } else {
            checkInternalSingle(comment);
          }
        });
      },
    };
  },
};
