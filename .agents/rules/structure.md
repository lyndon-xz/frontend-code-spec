---
description: 决定同一份值放在哪、谁可以依赖谁、一个模块对外承诺什么
---

# 结构

## 1、要一起改的值只在一个模块里声明

为什么：基础设施的常量、类型和函数在公共库或调用方再定义一份，改费率时会漏一处。

```ts
// ✅ 超时只在请求模块导出，调用方引用它
import { REQUEST_TIMEOUT_MS } from '@/apis/request';
// ❌ 调用方按记得的数字再写一个同名常量
const REQUEST_TIMEOUT_MS = 8000;
```

边界：值碰巧相同、语义各自独立的，分开声明。

## 2、一个字段的默认值只写在一处

为什么：同一字段的缺省散在多个调用点，改一处忘一处，两条路径会拿到不同的缺省。

```ts
// ✅ 缺省只在读取存储的那一处给出
const keyword = saved.keyword ?? '';
// ❌ 每个消费方各自再写一遍同一个缺省
const draft = form.keyword ?? '';
const title = query.keyword ?? '';
```

边界：缺省只补缺失。用逻辑或把 0 和空串一起换掉，由类型检查报错。

## 3、依赖从入口层指向下层

为什么：请求层或公共库引用某个页面之后，复用就会把那个页面拖进来，也容易绕成环。

```ts
// ✅ 页面引用请求层
import { fetchStays } from '@/apis/stays';
// ❌ 请求层为了拼参数去引页面里的筛选组件
import { SearchFilters } from '@/pages/search/search-filters';
```

边界：层按谁为谁服务划分：页面和路由，然后领域组件与领域服务，然后请求、配置和数据访问，然后公共库。上层可以依赖下层。公共库引用页面的那几条路径由工具报错，这条还看领域层有没有指回某个入口。

## 4、跨模块只引用对方的公开入口

为什么：调用方引用了内部辅助函数之后，对方一重构就是破坏性改动。

```ts
// ✅ 从模块入口拿列表
import { HotelList } from '@/pages/search/hotel-list';
// ❌ 直接引用该模块内部的格式化函数
import { formatPrice } from '@/pages/search/hotel-list/format-price';
```

边界：需要被外面用的能力，由这个模块放进公开入口。

## 5、互相决定取值的概念放在同一个模块

为什么：两个枚举分居两处、映射表在第三处，新增一个取值时只能靠记忆去改。

```ts
// ✅ 对象类型、操作类型和它们的映射在同一个模块
export const operationsByObject = { hotel: ['modify', 'cancel'], flight: ['cancel'] };
// ❌ 映射表落在第三个文件，新增类型时对不上
type ObjectKind = 'hotel' | 'flight';
const operationsByObject = { hotel: ['modify', 'cancel'] };
```

边界：内聚看模块，不看是不是同一个函数。不为了分组把互相决定的概念拆开。

## 6、两边都依赖的字符串收成一处常量

为什么：存储键、事件名和请求头只要另一端也认这个值，它就是契约。各写一遍字面量，改一处必漏。

```ts
/** ✅ 详情页与搜索页共享的筛选缓存键 */
export const FILTER_CACHE_KEY = 'stay-filter';
// ❌ 两个页面各写一遍同一个字符串
localStorage.setItem('stay-filter', filters);
sessionStorage.getItem('stay-filter');
```

边界：只出现一次也要收，只要另一端依赖它。没有跨单元约定、只是重复出现的字面量，不归这条。

## 7、公开接口只表达能力，不露出内部顺序和存放形态

为什么：调用方必须先 init 再取值，或者拿到内部 Map 的引用，内部一换结构，外面全部跟着改。外部还能绕过校验直接改那份数据。

```ts
// ✅ 第一次使用时自己加载，返回拷贝
const getRooms = () => {
  ensureLoaded();
  return rooms.slice();
};
// ❌ 调用方必须记得先 load，而且拿到的是内部数组本身
await loadRooms();
const rooms = getRooms();
rooms.push(room);
```

边界：框架要求的可变数据对象按框架写。为了少拷贝而返回内部引用的，在该函数上注明调用方不能修改。本模块内部才用的辅助函数被导出，删掉那个导出。

## 8、参数只包含函数体内读到的数据

为什么：为了取一两个字段传入整个实体，调用方就得把无关上下文也造出来。

```ts
// ✅ 格式化只接收它展示的字段
const formatPrice = (cents: number) => `${cents / 100}`;
// ❌ 函数签名收下整个订单，体内只用价格
const formatPrice = (order: Order) => `${order.cents / 100}`;
```

边界：调用方需要整单才能完成的编排，可以接收整个订单。这条判的是体内没有读到的字段。

## 9、公共目录按领域分，不按工具堆

为什么：helper、common 这种目录谁都能往里放，之后谁也不敢删，按领域名也搜不到消费方。

```ts
// ✅ 公共常量按领域分文件：src/constants/stay.ts
// ❌ 跨领域的函数堆进一个 common.ts
export const formatPrice = (cents: number) => cents / 100;
export const formatDate = (value: string) => value;
```

边界：集合目录可以按形态叫 components、utils、hooks、constants，里面再按领域分文件。再套一层形态目录，和堆进 common 是同一件事。

## 10、同一层有两个同领域文件时收进领域目录，目录内去掉领域前缀

为什么：导入路径里已经有目录名，文件名再挂一遍同一个词，读的人要对两次才知道是不是同一个东西。

```ts
// ✅ 目录带领域，文件名不再重复：src/utils/user/profile.ts
// ❌ 建了 user 目录，文件仍叫 user-profile.ts：src/utils/user/user-profile.ts
```

边界：从两个文件起收，而且这两个文件得是同一个领域。不同关注点各一个文件时保持平铺，不收进同一个目录。拆开会拆散互相决定取值的概念，或者拆完只剩一个文件的空目录，就维持原样。

## 11、常量放在仍能盖住全部消费者的最小范围

为什么：只有本文件用的常量提到模块级，辐射范围被放大，别的文件会开始依赖它。

```ts
// ✅ 只有这个组件用的文案留在这个组件文件里，不导出
const EMPTY_LABEL = '暂无房源';
// ❌ 为了找个地方放，把只有一个组件用的文案提到全仓常量
export const EMPTY_LABEL = '暂无房源';
```

边界：只被本文件使用的留在该文件且不导出。模块内共享放到该模块的概念文件，跨模块放到对应领域的公共文件。带业务语义的枚举和映射即使暂时一个消费者，也放进概念文件。概念文件默认不新建，先写在最相关的骨架文件里。跨两个骨架文件、或自带类型加数据表加函数一整套时，再独立成文件。文件里的哪一行，不在这条里定。

## 12、第二处相同的逻辑抽成一处

为什么：两段相同的取值、转换和兜底各自演进，修一处会漏另一处。

```ts
// ✅ 两处列表的空结果提示调用同一个函数
const emptyLabel = (keyword: string) => (keyword ? `无匹配：${keyword}` : '无结果');
// ❌ 两个页面各写一遍同一段空结果判断
const searchLabel = keyword ? `无匹配：${keyword}` : '无结果';
const filterLabel = keyword ? `无匹配：${keyword}` : '无结果';
```

边界：这次改动里两处长得像，才归这条。函数体完全相同由工具报错。长在仓库另一处、只是做法相近的既有能力，不归这条。

## 13、同一批成员在类型、初值和读取处顺序一致

为什么：各处自成一套顺序时，漏了一个成员只能逐个搜，新增成员也不知道插在哪。

```ts
// ✅ 类型、初值和读取都是 price、rating、distance
type SortBy = 'price' | 'rating' | 'distance';
const initial = { price: 0, rating: 0, distance: 0 };
// ❌ 初值把 distance 放到第一位，和类型对不上
type SortBy = 'price' | 'rating' | 'distance';
const initial = { distance: 0, price: 0, rating: 0 };
```

边界：消费方只取子集时，保持这些字段在源里的相对顺序。

## 14、同一前缀在同一作用域读到第二次就解构

为什么：同一个前缀在函数体里出现第二次还用点号，前缀会在每一处重复。参数对象在函数体首部拆开，字段各自只用一次也拆。

```ts
// ✅ 签名留着 props，函数体首部拆开
function FlightCard(props: FlightCardProps) {
  const { airline, priceCents } = props;
  return `${airline}${priceCents}`;
}
// ❌ 回调里只读一个字段，却改成块体只为解构
items.map((item) => {
  const { name } = item;
  return name;
});
```

边界：前缀在这个作用域只出现一次时保持点号，不为这一次去加块体。以字段名为键的表、路径只有一段的投影、表达式里插不进语句的可空对象、判别联合的收窄，以及层级边界文件里表示跨层的前缀，保持点号。调用结果要落成变量时，落成解构。写入和方法调用不计次数。签名里解构由工具报错。

## 15、声明贴着第一次使用

为什么：声明离第一次使用太远，读的人要先记住还没用到的名字。函数里提前返回的路径还会把用不到的计算做完。

```ts
// ✅ 重试的类型紧挨着使用它的函数
type RetryContext = { attempt: number };
const sendWithRetry = async (context: RetryContext) => context;
// ❌ 类型堆在文件头，使用它的函数排在另一段
type RetryContext = { attempt: number };
type CreateRequestOptions = { timeoutMs: number };
const createPayload = (options: CreateRequestOptions) => options;
const sendWithRetry = async (context: RetryContext) => context;
```

边界：段内被引用的在前。被中段两个函数共用的常量，放在这两个里靠前的那个，不放到文件头。选项表和映射表放在模块作用域，不写进函数体。跨文件的导出不因此往头上挤，仍然贴着文件内抛出或调用它的地方。没有内聚关系的声明，才按类型、常量、函数的顺序兜底。各文件按自己的角色排组，不把两个文件的领域顺序硬拉成一样。
