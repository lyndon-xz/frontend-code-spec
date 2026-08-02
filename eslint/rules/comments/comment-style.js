function isExportNode(node) {
  let current = node;
  while (current) {
    if (current.type === 'ExportNamedDeclaration' || current.type === 'ExportDefaultDeclaration') {
      return true;
    }
    /*
     * 遇到函数体 / 对象体 / 类体 / 程序顶层就停止追溯：其内部的注释属于实现细节，
     * 不应被上层的 export 语义“传染”成文档注释。ClassBody 与 ObjectExpression 对称，
     * 保证「导出类的成员上方注释」和「导出对象的成员上方注释」判定一致（均按非导出处理）。
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

/*
 * 用“行首形态”判断整行是否像 JS 语句 / 声明，才视为被注释掉的代码；
 * 避免把仅含 () / => 的中文散文（如“通过 store.dispatch() 调用”）误判为代码。
 */
function looksLikeCommentedCode(text) {
  // 行首是 JS 语句 / 声明关键字
  if (
    /^(import|export|const|let|var|function|async|await|class|interface|type|enum|namespace|return|if|else|for|while|do|switch|case|break|continue|throw|new|delete|yield|console|window|document)\b/.test(
      text,
    )
  ) {
    return true;
  }
  // 行首是「标识符(...)」调用或「标识符 = ...」赋值（整行像语句）
  if (/^[A-Za-z_$][\w$.]*\s*(\(|=[^=])/.test(text)) {
    return true;
  }
  if (/[;{}]\s*$/.test(text)) {
    return true;
  }
  return false;
}

// 把 block 注释体清洗成单行纯文本（去掉每行的前导 *）
function stripBlock(value) {
  return value
    .split('\n')
    .map((line) => line.trim().replace(/^\*+\s*/, ''))
    .filter(Boolean)
    .join(' ');
}

/*
 * 是否为 JSDoc 形态的块注释（/** ... *\/）。判据是 `/*` 之后紧跟的字符为 *，
 * 即 comment.value 的首字符（不可 trim，否则每行带 ` * ` 前缀的普通块会被误判为 JSDoc）。
 */
function isJsdocBlock(comment) {
  return comment.type === 'Block' && comment.value.startsWith('*');
}

/*
 * 「无需校验」的注释：编译器/工具指令、三斜线引用、含标签的 JSDoc、被注释掉的代码。
 * 这些不参与位置与风格校验，一律放行。
 */
function isSkippableComment(comment) {
  const text = comment.value.trim();
  if (text.startsWith('eslint-') || text.startsWith('prettier-') || text.startsWith('@ts-')) {
    return true;
  }
  // 三斜线指令：/// <reference ... />
  if (comment.type === 'Line' && /^\/\s*</.test(text)) {
    return true;
  }
  // 含 JSDoc 标签的块注释（如 @deprecated），视为约定文档
  if (isJsdocBlock(comment) && text.includes('@')) {
    return true;
  }
  if (comment.type === 'Line' && looksLikeCommentedCode(text)) {
    return true;
  }
  return false;
}

// 生成「把注释移到目标代码上方独占一行」的 fixer；无前驱 token 时返回 null 表示不自动修复
function buildMoveAboveFix(sourceCode, comment, tokenBefore) {
  return (fixer) => {
    if (!tokenBefore) return null;
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

/*
 * 收集「连续堆叠、且同处一段代码上方」的注释组（导出与非导出通用）：
 * 从 startIdx 起，要求逐条行相邻、非可跳过、且共享同一后继代码 token。
 * 判定需要 sourceCode / comments / startIdx / tokenAfter 四项，故聚成一个对象入参。
 */
function collectCommentStack(scanContext) {
  const { sourceCode, comments, startIdx, tokenAfter } = scanContext;
  const stack = [comments[startIdx]];
  for (let j = startIdx + 1; j < comments.length; j++) {
    const next = comments[j];
    const prev = stack[stack.length - 1];
    if (isSkippableComment(next)) break;
    if (next.loc.start.line !== prev.loc.end.line + 1) break;
    if (sourceCode.getTokenAfter(next, { includeComments: false }) !== tokenAfter) break;
    stack.push(next);
  }
  return stack;
}

function extractCommentLines(stack) {
  return stack.map((item) => (item.type === 'Block' ? stripBlock(item.value) : item.value.trim()));
}

/*
 * 内容含块注释结束符（星号加斜杠）时不能包进块注释：会把块注释提前闭合，残留的结束符是语法错误。
 * 转义虽能编译，却改变了注释文字本身，同属改坏用户内容，故这类内容一律放弃自动修复、只报错。
 */
function canWrapInBlockComment(text) {
  return !text.includes('*/');
}

// 合并注释组为一个块注释：opener 决定是文档注释(/**)还是普通块(/*)
function buildMergedComment(stack, opener) {
  const indent = ' '.repeat(stack[0].loc.start.column);
  const lines = extractCommentLines(stack);
  return `${opener}\n${lines.map((line) => `${indent} * ${line}`).join('\n')}\n${indent} */`;
}

/**
 * 根据导出语义强制注释风格，以「注释正下方的代码是否为 export」为唯一分界：
 * - 所有注释必须写在目标代码上方独占一行（内联参数块注释除外）。
 * - export 声明上方 → `/** *\/` 文档注释；多段堆叠合并为一个。
 * - 其余位置（顶层非导出 / 函数体内部 / 文件尾部）：单行 → `//`；多行 → `/* *\/`（而非 JSDoc）；
 *   多段堆叠 → 合并为一个 `/* *\/` 块（与 export 上方合并为 `/** *\/` 对称）。
 *
 * 优先级：先放行指令 / 被注释掉的代码 / 内联参数注释，再判位置，最后判风格。
 */
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

    // 多段堆叠合并为一个块注释：导出上方用 /** */，其余位置用 /* */
    function reportMerge(stack, isExport) {
      const first = stack[0];
      const last = stack[stack.length - 1];
      const canFix = extractCommentLines(stack).every(canWrapInBlockComment);
      context.report({
        loc: { start: first.loc.start, end: last.loc.end },
        messageId: isExport ? 'exportMergeJsdoc' : 'internalMergeBlock',
        fix: canFix
          ? (fixer) =>
              fixer.replaceTextRange(
                [first.range[0], last.range[1]],
                buildMergedComment(stack, isExport ? '/**' : '/*'),
              )
          : null,
      });
    }

    // 导出上方单条：已是 /** */ 则合规，否则（// 或普通 /* */）转成 /** */
    function checkExportSingle(comment) {
      if (isJsdocBlock(comment)) return;
      const content = comment.type === 'Block' ? stripBlock(comment.value) : comment.value.trim();
      context.report({
        loc: comment.loc,
        messageId: 'exportNeedsJsdoc',
        fix: canWrapInBlockComment(content)
          ? (fixer) => fixer.replaceText(comment, `/** ${content} */`)
          : null,
      });
    }

    // 非导出单条：行注释天然合规；单行块 → //；多行 JSDoc → 普通 /* */
    function checkInternalSingle(comment) {
      if (comment.type !== 'Block') return;

      const isMultiLine = comment.loc.start.line !== comment.loc.end.line;
      if (!isMultiLine) {
        context.report({
          loc: comment.loc,
          messageId: 'internalSingleLine',
          fix: (fixer) => fixer.replaceText(comment, `// ${stripBlock(comment.value)}`),
        });
        return;
      }
      // 普通多行 /* */ 合规；只有多行 JSDoc 需降级
      if (isJsdocBlock(comment)) {
        context.report({
          loc: comment.loc,
          messageId: 'internalMultiLine',
          // 去掉注释体开头的一个 *，把 /** 降级为 /*
          fix: (fixer) => fixer.replaceText(comment, `/*${comment.value.replace(/^\*/, '')}*/`),
        });
      }
    }

    return {
      Program() {
        const comments = sourceCode.getAllComments();
        const visited = new Set();

        comments.forEach((comment, idx) => {
          if (visited.has(comment) || isSkippableComment(comment)) return;

          const isBlock = comment.type === 'Block';
          const tokenBefore = sourceCode.getTokenBefore(comment, { includeComments: false });
          const tokenAfter = sourceCode.getTokenAfter(comment, { includeComments: false });

          // 1) 位置：必须在目标代码上方独占一行
          const sameLineBefore = tokenBefore && tokenBefore.loc.end.line === comment.loc.start.line;
          const sameLineAfter = tokenAfter && tokenAfter.loc.start.line === comment.loc.end.line;
          if (sameLineBefore || sameLineAfter) {
            // 内联参数块注释放行：foo(/* name */ 'bar')
            if (isBlock && sameLineBefore && sameLineAfter) return;
            context.report({
              loc: comment.loc,
              messageId: 'notAbove',
              fix: sameLineBefore
                ? buildMoveAboveFix(sourceCode, comment, tokenBefore)
                : () => null,
            });
            return;
          }

          // 2) 语义：按下方代码是否为 export 分流。先收堆叠、多段合并，否则按位置处理单条
          const nodeAfter = sourceCode.getNodeByRangeIndex(
            tokenAfter ? tokenAfter.range[0] : comment.range[1],
          );
          const isExport = isExportNode(nodeAfter);
          const stack = collectCommentStack({ sourceCode, comments, startIdx: idx, tokenAfter });
          stack.forEach((item) => visited.add(item));

          if (stack.length > 1) {
            reportMerge(stack, isExport);
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
