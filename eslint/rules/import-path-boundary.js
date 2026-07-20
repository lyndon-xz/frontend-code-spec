import path from 'path';

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '模块内部使用相对路径，跨模块引用使用 @/ 别名',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          srcDir: {
            type: 'string',
            default: 'src',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] || {};
    const srcDirName = options.srcDir ?? 'src';

    const filename = context.filename || context.getFilename();

    // 从文件绝对路径中提取 src/ 之后的部分
    const srcIndex = filename.lastIndexOf(`/${srcDirName}/`);
    if (srcIndex === -1) {
      return {};
    }

    const srcRoot = filename.substring(0, srcIndex + srcDirName.length + 2);
    const relativeToSrc = filename.substring(srcIndex + srcDirName.length + 2);

    // 当前文件所属的一级模块 (如 apis, pages, utils)
    const currentModule = relativeToSrc.split('/')[0];

    return {
      ImportDeclaration(node) {
        const source = node.source.value;

        /** 只处理 @/ 开头的别名导入和 ../ 开头的相对导入 */
        if (!source.startsWith('@/') && !source.startsWith('../') && !source.startsWith('./')) {
          return;
        }

        /** ---- 检查 @/ 别名导入 ---- */
        if (source.startsWith('@/')) {
          /** @/ 后面的路径就是 src/ 下的路径 */
          const importPath = source.substring(2);
          const targetModule = importPath.split('/')[0];

          if (targetModule === currentModule) {
            const absoluteImportPath = path.resolve(srcRoot, importPath);
            let relativePath = path.relative(path.dirname(filename), absoluteImportPath);
            if (!relativePath.startsWith('.')) {
              relativePath = './' + relativePath;
            }

            context.report({
              node: node.source,
              message: `模块内部引用请使用相对路径，不要使用 @/ 别名（当前模块：${currentModule}/）`,
              fix(fixer) {
                return fixer.replaceText(node.source, `'${relativePath}'`);
              },
            });
          }
          return;
        }

        // ---- 检查相对路径导入：只关注向上跨目录的 ../ ----
        if (!source.startsWith('../')) {
          // 同级 ./ 导入肯定是模块内部，跳过
          return;
        }

        // 解析相对路径到绝对路径
        const currentDir = path.dirname(filename);
        const resolvedPath = path.resolve(currentDir, source);

        // 检查解析后的路径是否还在 src/ 下
        if (!resolvedPath.startsWith(srcRoot)) {
          return;
        }

        // 提取目标文件所属的一级模块
        const targetRelativeToSrc = resolvedPath.substring(srcRoot.length);
        const targetModule = targetRelativeToSrc.split('/')[0];

        if (targetModule !== currentModule) {
          context.report({
            node: node.source,
            message: `跨模块引用请使用 @/ 别名（从 ${currentModule}/ 引用 ${targetModule}/），如：@/${targetRelativeToSrc}`,
            fix(fixer) {
              return fixer.replaceText(node.source, `'@/${targetRelativeToSrc}'`);
            },
          });
        }
      },
    };
  },
};
