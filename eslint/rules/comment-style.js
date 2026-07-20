// 判断节点是否为导出声明（在函数体边界处停止追溯）
function isExportNode(node) {
  if (!node) return false;

  let current = node;
  while (current) {
    if (current.type === 'ExportNamedDeclaration' || current.type === 'ExportDefaultDeclaration') {
      return true;
    }
    // 遇到函数体/对象体/程序顶层就停止追溯：其内部的注释属于实现细节，不应视为导出注释
    if (
      current.type === 'FunctionDeclaration' ||
      current.type === 'FunctionExpression' ||
      current.type === 'ArrowFunctionExpression' ||
      current.type === 'ObjectExpression' ||
      current.type === 'Program'
    ) {
      break;
    }
    current = current.parent;
  }
  return false;
}

// 用「行首形态」判断整行是否像 JS 语句/声明，才视为被注释掉的代码；避免把仅含 () / => 的中文散文（如「通过 store.dispatch() 调用」）误判为代码。
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
  // 以 ; { } 结尾
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

export default {
  meta: {
    type: 'layout',
    docs: {
      description: '根据导出语义强制注释风格：export 声明使用 /** */，内部实现使用 //；导出上方多段注释合并为一个',
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode();

    function isSkippable(comment) {
      const text = comment.value.trim();
      // 特殊指令注释
      if (
        text.startsWith('eslint-') ||
        text.startsWith('prettier-') ||
        text.startsWith('@ts-') ||
        text.startsWith('/')
      ) {
        return true;
      }
      // 含 JSDoc 标签的块注释（如 @deprecated）
      if (comment.type === 'Block' && text.startsWith('*') && text.includes('@')) {
        return true;
      }
      // 被注释掉的代码
      if (comment.type === 'Line' && looksLikeCommentedCode(text)) {
        return true;
      }
      return false;
    }

    return {
      Program() {
        const comments = sourceCode.getAllComments();
        const visited = new Set();

        comments.forEach((comment, idx) => {
          if (visited.has(comment) || isSkippable(comment)) {
            return;
          }

          const text = comment.value.trim();
          const isBlock = comment.type === 'Block';

          const tokenBefore = sourceCode.getTokenBefore(comment, { includeComments: false });
          const tokenAfter = sourceCode.getTokenAfter(comment, { includeComments: false });

          // --- 位置校验（必须在目标代码上方独占一行） ---
          const isSameLineAsBefore = tokenBefore && tokenBefore.loc.end.line === comment.loc.start.line;
          const isSameLineAsAfter = tokenAfter && tokenAfter.loc.start.line === comment.loc.end.line;

          if (isSameLineAsBefore || isSameLineAsAfter) {
            // 放行内联参数注释，如 foo(/* name */ 'bar')
            if (isBlock && isSameLineAsBefore && isSameLineAsAfter) {
              return;
            }

            context.report({
              loc: comment.loc,
              message: '通用注释必须写在目标代码上方独占一行',
              fix(fixer) {
                if (isSameLineAsBefore && tokenBefore) {
                  const sourceCodeText = sourceCode.text;
                  const commentText = sourceCodeText.slice(comment.range[0], comment.range[1]);

                  const lineStart = sourceCode.getIndexFromLoc({ line: comment.loc.start.line, column: 0 });
                  const textFromLineStartToToken = sourceCodeText.slice(lineStart, tokenBefore.range[0]);
                  const indent = textFromLineStartToToken.match(/^[ \t]*/)[0];
                  const textBetween = sourceCodeText.slice(tokenBefore.range[1], comment.range[0]);
                  const spacesToRemove = textBetween.match(/[ \t]+$/) ? textBetween.match(/[ \t]+$/)[0].length : 0;

                  return [
                    fixer.insertTextBeforeRange([lineStart, lineStart], commentText + '\n' + indent),
                    fixer.removeRange([comment.range[0] - spacesToRemove, comment.range[1]]),
                  ];
                }
                return null;
              },
            });
            return;
          }

          // --- 语义校验：根据下方代码是否为 export 判定注释风格 ---
          const nodeAfter = sourceCode.getNodeByRangeIndex(tokenAfter ? tokenAfter.range[0] : comment.range[1]);
          const isBeforeExport = isExportNode(nodeAfter);

          if (isBeforeExport) {
            // 收集与本条注释「连续堆叠、且同处一个导出上方」的注释组：行相邻 + 共享同一后继代码 token
            const stack = [comment];
            for (let j = idx + 1; j < comments.length; j++) {
              const next = comments[j];
              const prev = stack[stack.length - 1];
              if (isSkippable(next)) break;
              if (next.loc.start.line !== prev.loc.end.line + 1) break;
              if (sourceCode.getTokenAfter(next, { includeComments: false }) !== tokenAfter) break;
              stack.push(next);
            }
            stack.forEach((item) => visited.add(item));

            // 单个 /** */ —— 合规
            if (stack.length === 1 && isBlock) {
              return;
            }

            // 单个 // —— 转成 /** */
            if (stack.length === 1) {
              context.report({
                loc: comment.loc,
                message: '导出声明的注释必须使用 `/** */` 文档注释格式',
                fix(fixer) {
                  return fixer.replaceText(comment, `/** ${text} */`);
                },
              });
              return;
            }

            // 多段注释堆叠在导出上方 —— 合并为一个 /** */
            const first = stack[0];
            const last = stack[stack.length - 1];
            const indent = ' '.repeat(first.loc.start.column);
            const lines = stack.map((item) => (item.type === 'Block' ? stripBlock(item.value) : item.value.trim()));
            const merged = `/**\n${lines.map((line) => `${indent} * ${line}`).join('\n')}\n${indent} */`;

            context.report({
              loc: { start: first.loc.start, end: last.loc.end },
              message: '导出上方的多段注释应合并为一个 `/** */` 文档注释',
              fix(fixer) {
                return fixer.replaceTextRange([first.range[0], last.range[1]], merged);
              },
            });
            return;
          }

          // 非导出代码用 // ；块注释转行注释
          if (isBlock) {
            context.report({
              loc: comment.loc,
              message: '非导出代码的注释必须使用 `//` 行注释格式',
              fix(fixer) {
                return fixer.replaceText(comment, `// ${stripBlock(comment.value)}`);
              },
            });
          }
        });
      },
    };
  },
};
