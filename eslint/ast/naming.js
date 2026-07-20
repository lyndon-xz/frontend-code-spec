export default {
  meta: { type: 'problem' },
  create(context) {
    return {
      'FunctionDeclaration > Identifier.id[name=/^handle[A-Z]/]'(node) {
        context.report({ node, message: '函数禁止 handle 前缀，必须使用语义化动词（如 saveData 而非 handleClick）' });
      },
      'VariableDeclarator > Identifier.id[name=/^handle[A-Z]/]'(node) {
        context.report({ node, message: '变量/函数禁止 handle 前缀，必须使用语义化动词' });
      },
      ':matches(FunctionDeclaration, ArrowFunctionExpression, FunctionExpression) > Identifier.params[name=/^(data|params|callback|options)$/]'(
        node,
      ) {
        context.report({ node, message: '参数禁止泛化命名（data、params、callback、options），请使用具体的领域词汇' });
      },
      ':matches(FunctionDeclaration, ArrowFunctionExpression, FunctionExpression) > AssignmentPattern.params > Identifier.left[name=/^(data|params|callback|options)$/]'(
        node,
      ) {
        context.report({ node, message: '参数禁止泛化命名（data、params、callback、options），请使用具体的领域词汇' });
      },
      ':matches(FunctionDeclaration, ArrowFunctionExpression, FunctionExpression) > RestElement.params > Identifier.argument[name=/^(data|params|callback|options)$/]'(
        node,
      ) {
        context.report({ node, message: '参数禁止泛化命名（data、params、callback、options），请使用具体的领域词汇' });
      },
      'VariableDeclarator[init.callee.name="useRef"] > Identifier.id[name!=/Ref$/]'(node) {
        context.report({ node, message: 'Ref 变量必须以 Ref 结尾（如 inputRef）' });
      },
      'VariableDeclarator[init.callee.property.name="useRef"] > Identifier.id[name!=/Ref$/]'(node) {
        context.report({ node, message: 'Ref 变量必须以 Ref 结尾（如 inputRef）' });
      },
      'VariableDeclarator[init.type=/FunctionExpression|ArrowFunctionExpression/] > Identifier.id[name=/^on[A-Z]/]'(
        node,
      ) {
        context.report({
          node,
          message: '`on` 前缀仅用于 Props 回调声明，内部函数请使用语义化动词（如 saveData 而非 onSave）',
        });
      },
      'FunctionDeclaration > Identifier.id[name=/^on[A-Z]/]'(node) {
        context.report({
          node,
          message: '`on` 前缀仅用于 Props 回调声明，内部函数请使用语义化动词（如 saveData 而非 onSave）',
        });
      },
    };
  },
};
