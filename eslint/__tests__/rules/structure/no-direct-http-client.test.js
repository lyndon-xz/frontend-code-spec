import rule from '../../../rules/structure/no-direct-http-client.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('no-direct-http-client', rule, {
  valid: [
    // 请求层自身必须直连，否则无从封装
    { code: 'import axios from "axios";', filename: 'src/apis/request.ts' },
    { code: 'const res = await fetch("/x");', filename: 'src/apis/utils/raw.ts' },
    // 业务代码走 apis 层出口
    {
      code: 'import { fetchFlights } from "@/apis/services/flight";',
      filename: 'src/pages/flight/index.tsx',
    },
    // 其它模块的导入不受影响
    { code: 'import dayjs from "dayjs";', filename: 'src/pages/flight/index.tsx' },
    // 同名但语义无关的成员：fetchList 不是 HTTP 客户端
    { code: 'store.fetchList();', filename: 'src/pages/flight/index.tsx' },
    // 自研封装的方法也可能叫 fetch，只有挂在宿主对象上的才判定为直连
    { code: 'this.client.fetch("/x");', filename: 'src/pages/flight/index.tsx' },
    { code: 'repository.fetch(id);', filename: 'src/pages/flight/index.tsx' },
    // 计算成员访问不做猜测，避免误报
    { code: 'api["fetch"]();', filename: 'src/pages/flight/index.tsx' },
    // 其它构造调用、裸函数调用与成员访问不受影响
    { code: 'const now = new Date();', filename: 'src/pages/flight/index.tsx' },
    { code: 'const value = store.state;', filename: 'src/pages/flight/index.tsx' },
    { code: 'loadFlights();', filename: 'src/pages/flight/index.tsx' },
    // 宿主对象上的非客户端属性照常放行
    { code: 'const url = window.location.href;', filename: 'src/pages/flight/index.tsx' },
    // 计算成员的键是变量引用而非属性名，跳过
    { code: 'const value = api[fetch];', filename: 'src/pages/flight/index.tsx' },
    // allowedPaths 可配：把 services 也纳入放行范围
    {
      code: 'import axios from "axios";',
      filename: 'src/services/http.ts',
      options: [{ allowedPaths: ['src/services'] }],
    },
  ],
  invalid: [
    {
      // 绕过请求层直连，会丢掉错误归一、提示、重试与埋点
      code: 'import axios from "axios";',
      filename: 'src/pages/flight/index.tsx',
      errors: [{ messageId: 'noClientImport', data: { module: 'axios' } }],
    },
    {
      // 默认禁令不止 axios：got / node-fetch / superagent / ky 一并在列
      code: 'import got from "got";',
      filename: 'src/pages/flight/index.tsx',
      errors: [{ messageId: 'noClientImport' }],
    },
    {
      code: 'const res = await fetch("/api/flight/list");',
      filename: 'src/pages/flight/index.tsx',
      errors: [{ messageId: 'noGlobalClient', data: { client: 'fetch' } }],
    },
    {
      // 挂在宿主对象上是绕过裸标识符检查的常见写法
      code: 'window.fetch("/api/x");',
      filename: 'src/pages/flight/index.tsx',
      errors: [{ messageId: 'noGlobalClient' }],
    },
    {
      code: 'globalThis.fetch("/api/x");',
      filename: 'src/pages/flight/index.tsx',
      errors: [{ messageId: 'noGlobalClient' }],
    },
    {
      code: 'const xhr = new XMLHttpRequest();',
      filename: 'src/pages/flight/index.tsx',
      errors: [{ messageId: 'noGlobalClient' }],
    },
    {
      // 组件里直连同样禁止
      code: 'import axios from "axios";\nexport default function Card() { return null; }',
      filename: 'src/components/flight-card/index.tsx',
      errors: [{ messageId: 'noClientImport' }],
    },
    {
      // clientModules 可配：把内部 http 包也纳入禁令
      code: 'import http from "@company/http";',
      filename: 'src/pages/flight/index.tsx',
      options: [{ clientModules: ['@company/http'] }],
      errors: [{ messageId: 'noClientImport' }],
    },
  ],
});
