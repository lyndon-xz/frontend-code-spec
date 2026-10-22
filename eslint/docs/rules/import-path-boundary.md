# `custom/import-path-boundary`

同一模块内部用相对路径，跨模块用 `@/` 别名。模块按 `src` 下第一级目录划分；`containerDirs` 里的目录 (默认 `pages`) 下每个子目录各算一个模块。

## 为什么

路径形态本身就在说明依赖关系：看到 `./`、`../` 就知道是模块内部的拆分，看到 `@/` 就知道越过了模块边界。跨模块写相对路径会把目录层级耦合进代码，挪一个目录就要改一串 `../../`；模块内部写别名则看不出它和当前文件是同一组。

## 示例

```ts
// src/pages/search/index.tsx

// ✅ 模块内相对路径，跨模块别名
import { SearchBar } from './search-bar';
import { formatPrice } from '@/utils/price';
import { DetailEntry } from '@/pages/detail/detail-entry';

// ❌ 模块内用别名；跨模块（pages/detail）用相对路径
import { SearchBar } from '@/pages/search/search-bar';
import { DetailEntry } from '../detail/detail-entry';
```

## 选项

- `srcDir`：源码根目录，默认 `src`。
- `containerDirs`：子目录各算一个模块的容器目录，默认 `['pages']`，每项是不含斜杠的单段目录名。

可自动修复。生效范围：`src/` 下的 ts / tsx。
