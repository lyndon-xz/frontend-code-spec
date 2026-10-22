import { describe, expect, it } from 'vitest';

import { ruleDocsUrl } from '../../utils/rule-docs-url.js';

describe('ruleDocsUrl', () => {
  it('指向仓库 main 分支下同名的规则文档', () => {
    expect(ruleDocsUrl('comment-style')).toBe(
      'https://github.com/lyndon-xz/frontend-code-spec/blob/main/eslint/docs/rules/comment-style.md',
    );
  });
});
