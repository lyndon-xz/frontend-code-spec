---
description: 规定什么时候抽名字，以及名字是否说准
---

# 命名

## 1、名字只在减少重复或解释这个值时抽出来

为什么：重复写同一个值，改一处会漏；只复述右侧的名字，会让值和它唯一的用途隔开。

```ts
// ✅ 两处使用同一个状态码，命名后只改一处
const CONFLICT_STATUS = 409;
// ✅ 只用一次，但数字本身没有解释
const MAX_ROOM_COUNT = 8;
// ❌ 只出现一次，名字只复述右侧
const pageName = 'stay-page';
persist({ name: pageName });
```

边界：被两处及以上使用的值必须命名，跨文件也算。只出现一次、名字只复述右侧的，直接写在使用处。数字、时长、业务标识这类本身没有解释的，即使只用一次也命名。参数解构得到的字段名保留，不算为用一次的值新起名字。

## 2、同一概念从接口字段到状态再到参数用同一个词

为什么：同一笔订单一会儿叫 order、一会儿叫 trade，搜消费方会漏，也会被人当成两个东西。

```ts
// ✅ 接口、状态和组件参数都叫 stayId
const selectedStayId = stay.stayId;
// ❌ 状态里改叫 houseId，和接口字段对不上
const selectedHouseId = stay.stayId;
```

边界：跨边界契约已有的词以契约为准，不在这一侧另起名字。概念本身和业务说法不一致时，不在这里改名。

## 3、函数名以动词开头，并带上它作用的对象

为什么：只有名词的函数和变量分不开，读的人不知道调用它会不会产生动作。

```ts
// ✅ 名字说明提交的是订单
const submitOrder = async (orderId: string) => pay(orderId);
// ❌ 函数名叫 order，看不出是读取还是提交
const order = async (orderId: string) => pay(orderId);
```

边界：组件用 PascalCase 名词，Hook 用 use 加名词或动词，这条只管普通函数与方法。handle 前缀和 Async 后缀由工具报错。回调字段上的 on 前缀只留给组件的 Props。

## 4、以取反使用为主的条件改成肯定式

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

边界：isDisabled 这种反义名可以留。同一名字在全仓被取反使用的次数多于直接使用，才换成肯定式。

## 5、领域目录和单实体文件用单数，集合用复数

为什么：打开之前只能靠单复数判断里面是一个东西，还是一组里挑一个。

```ts
// ✅ 领域用单数，集合目录用复数：auth/login.ts、components/stay-card.ts
// ❌ 领域目录用了复数，集合目录用了单数：stays/login.ts、component/stay-cards.ts
```

边界：业务域用单数，如 auth、hotel。技术层与集合用复数：components、utils、hooks、constants、apis、pages、layouts。一个文件只装一个实体及其附属声明时用单数，装一组同类成员时用复数。枚举名用单数，大小写由工具检查。

## 6、名字指代它所承载的概念

为什么：layout 让人去找目录怎么摆，打开才发现是一组文件范围。名字指到旁边的概念，读的人会去错地方。

```ts
// ✅ 这份值是规则生效的文件范围
export const sourceGlobs = ['src/**/*.ts'];
// ❌ 用 layout 指文件范围，打开对不上
export const sourceLayout = ['src/**/*.ts'];
```

边界：两个词都说得通时，用打开之后对得上的那个。指到旁边那类事的词就不用。文件里的函数可以比文件名更细。数值常量的名字带对象、单位和边界，如 MAX_STAY_NIGHTS 而不是 MAX。

## 7、文件名用领域概念

为什么：文件按当前这一个函数起名，概念里再加一个函数就得再开一个文件。

```ts
// ✅ 文件是响应信封这个概念，函数比文件更细：envelope.ts 里导出 hasNumberField
// ❌ 文件名等于当前这一个函数：has-number-field.ts
```

边界：分层标准规定的固定角色文件名，如 index、model、actions、store、slice、effects、config，按分层约定，不按领域改名。这条只定已经独立成文件的名字，不决定要不要新建文件。函数可以比文件更细。这条适用所有目录。
