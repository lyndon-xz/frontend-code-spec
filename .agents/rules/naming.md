---
description: 规定什么时候抽名字，以及名字是否说准
---

# 命名

## 1、名字被两处使用，或负责解释这个值，才把它抽出来

为什么：阈值、时长和业务标识如果不命名，读的人不知道这个数字为什么在这。

```ts
// ✅ 只用一次的上限也命名，因为数字本身没有解释
const MAX_ROOM_COUNT = 8;
if (rooms.length > MAX_ROOM_COUNT) {
  return;
}
// ❌ 两处各写同一个状态码，以后改一处会漏另一处
if (response.status === 409) {
  return;
}
if (error.status === 409) {
  retry();
}
```

边界：被两处及以上使用的值必须命名，跨文件也算。只出现一次、删掉名字仍然看得懂的，直接写在使用处。函数体首部把参数拆开得到的字段名留着，那是去掉重复的前缀，不是为用一次的值新起名字。

## 2、只用一次、名字不增加信息的中间值直接写在使用处

为什么：抽出去之后，值和它唯一的用途隔开，读的人要跳一次才看到。

```ts
// ✅ 调用处直接看到传入的是哪一项
persist({ name: 'stay-page' });
// ❌ 先赋给一个只复述右侧的常量，再在下一行使用
const pageName = 'stay-page';
persist({ name: pageName });
```

边界：含两个及以上复合条件、内联后深折行、或名字把过程收成一个结论时，仍然抽出名字。函数体首部拆开参数得到的字段不并回点号。

## 3、get 只读取，is 与 has 返回布尔，会发请求的用 fetch

为什么：名字承诺的事和函数做的事不一致时，读的人会按承诺跳过实现。

```ts
// ✅ 发请求的函数用 fetch，布尔判断用 is
const fetchStays = () => request('/stays');
const isOpen = (stay: Stay) => stay.status === 'open';
// ❌ get 里面写了缓存，is 返回的是字符串
const getStay = (stay: Stay) => {
  cache.set(stay.id, stay);
  return stay;
};
const isOpen = (stay: Stay) => (stay.status === 'open' ? '营业中' : '已关闭');
```

边界：布尔前缀、handle、on 和 Async 后缀由工具检查。get 有没有发请求、is 返回的是不是布尔，看这里。

## 4、同一概念从接口字段到状态再到参数用同一个词

为什么：同一笔订单一会儿叫 order、一会儿叫 trade，搜消费方会漏，也会被人当成两个东西。

```ts
// ✅ 接口、状态和组件参数都叫 stayId
const selectedStayId = stay.stayId;
// ❌ 状态里改叫 houseId，和接口字段对不上
const selectedHouseId = stay.stayId;
```

边界：跨边界契约已有的词以契约为准，不在这一侧另起名字。概念本身和业务说法不一致时，不在这里改名。

## 5、函数名以动词开头，并带上它作用的对象

为什么：只有名词的函数和变量分不开，读的人不知道调用它会不会产生动作。

```ts
// ✅ 名字说明提交的是订单
const submitOrder = async (orderId: string) => pay(orderId);
// ❌ 函数名叫 order，看不出是读取还是提交
const order = async (orderId: string) => pay(orderId);
```

边界：handle 前缀和 Async 后缀由工具报错。回调字段上的 on 前缀只留给组件的 Props。

## 6、多数时候被取反的条件改成肯定式

为什么：否定式名字前面再取反，读的人要转一次才知道分支进的是哪边。

```ts
// ✅ 主要读取路径用肯定式
if (isOpen) {
  showRooms();
}
// ❌ 名字本身带否定，使用处再取反
if (!isClosed) {
  showRooms();
}
```

边界：isDisabled 这种反义名可以留。只有它大多数时候写成取反，才换成肯定式。

## 7、常量名含对象、单位和边界

为什么：只剩 MAX 或一个数字时，读的人不知道它约束的是房间数还是晚数。

```ts
// ✅ 名字里有对象和单位
const MAX_STAY_NIGHTS = 30;
// ❌ 名字只剩 MAX，使用处看不出单位
const MAX = 30;
if (nights > MAX) {
  return;
}
```

边界：类型字段上的金额、时长和尺寸后缀由工具检查。这条看顶层常量有没有把对象和边界写进名字。

## 8、领域目录和单实体文件用单数，集合用复数

为什么：打开之前只能靠单复数判断里面是一个东西，还是一组里挑一个。

```ts
// ✅ 领域用单数，集合目录用复数：auth/login.ts、components/stay-card.ts
// ❌ 领域目录用了复数，集合目录用了单数：stays/login.ts、component/stay-cards.ts
```

边界：功能领域用单数。components、utils、hooks 这类集合用复数。一个文件只装一个实体及其附属声明时用单数，装一组同类成员时用复数。枚举名用单数，大小写由工具检查。

## 9、名字说清它装的是什么

为什么：layout 让人去找目录怎么摆，打开才发现是一组文件范围。名字指到旁边的概念，读的人会去错地方。

```ts
// ✅ 这份值是规则生效的文件范围
export const sourceGlobs = ['src/**/*.ts'];
// ❌ 用 layout 指文件范围，打开对不上
export const sourceLayout = ['src/**/*.ts'];
```

边界：两个词都说得通时，用打开之后对得上的那个。指到旁边那类事的词就不用。文件里的函数可以比文件名更细。

## 10、文件名用领域概念

为什么：文件按当前这一个函数起名，概念里再加一个函数就得再开一个文件。

```ts
// ✅ 文件是响应信封这个概念，函数比文件更细：envelope.ts 里导出 hasNumberField
// ❌ 文件名等于当前这一个函数：has-number-field.ts
```

边界：这条只定已经独立成文件的名字，不决定要不要新建文件。函数可以比文件更细。这条适用所有目录。
