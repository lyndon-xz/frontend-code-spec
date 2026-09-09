/*
 * 只校验类型成员：它们是跨端传递的契约，单位歧义在这里代价最大；
 * 局部变量与函数参数生命周期短、上下文就在眼前，校验只会铺噪音。
 */

const DEFAULT_DIMENSIONS = [
  // 不收 `price`：`totalPrice` / `pricePerNight` 已说清是什么，强制后缀会铺满整个领域模型
  {
    name: '金额',
    roots: ['amount', 'fee', 'cost', 'balance', 'salary', 'discount', 'deposit'],
    suffixes: ['Cents', 'Yuan'],
  },
  {
    name: '时长',
    roots: ['duration', 'timeout', 'delay', 'interval', 'elapsed'],
    suffixes: ['Ms', 'Seconds', 'Minutes', 'Hours', 'Days'],
  },
  // 不收 `at` 结尾：createdAt / updatedAt 已是社区共识，强制 createdAtMs 属反惯例
  {
    name: '时间点',
    roots: ['time', 'timestamp', 'deadline', 'expires'],
    suffixes: ['Ms', 'Seconds', 'Iso', 'Utc'],
  },
  /*
   * 长度 / 数据量 / 质量各自成条：合成一个「尺寸」量纲会让建议给错单位（weight 收到 weightPx），
   * 也会放行量纲与单位对不上的命名（widthGrams）——matchDimension 只要末尾命中任一后缀就判已带单位。
   * 裸 `size` 与 `length` 不进默认值：它们跨长度（fontSize）、数据量（contentLength）与计数（maxLength）
   * 三种含义，默认收进来必然给错建议，需要时由项目用 dimensions 选项自行声明。
   */
  {
    name: '长度',
    roots: ['width', 'height', 'distance'],
    suffixes: ['Px', 'Rem', 'Percent', 'Meters', 'Km'],
  },
  {
    name: '数据量',
    roots: ['filesize', 'datasize', 'payloadsize'],
    suffixes: ['Bytes', 'Kb', 'Mb'],
  },
  {
    name: '质量',
    roots: ['weight'],
    suffixes: ['Grams', 'Kg'],
  },
];

// 选项默认值的唯一来源：schema 的 default 与 create 里的取值都引用此处
const DEFAULT_OPTIONS = {
  dimensions: DEFAULT_DIMENSIONS,
  ignoredFields: [],
};

// 判定停留在语法层，不做类型推断：只认 number 本体与含 number 的联合类型
function isNumericAnnotation(annotation) {
  if (annotation == null) {
    return false;
  }
  if (annotation.type === 'TSNumberKeyword') {
    return true;
  }
  if (annotation.type === 'TSUnionType') {
    return annotation.types.some(isNumericAnnotation);
  }
  return false;
}

// 未登记的单位写法（priceFen）识别不出来，属于用漏报换低噪音——补 dimensions 即可覆盖
function matchDimension(fieldName, dimensions) {
  for (const dimension of dimensions) {
    const { roots, suffixes } = dimension;
    const matchedSuffix = suffixes.find((suffix) => fieldName.endsWith(suffix));
    const baseName =
      matchedSuffix === undefined ? fieldName : fieldName.slice(0, -matchedSuffix.length);

    if (roots.some((root) => baseName.toLowerCase().endsWith(root))) {
      return { dimension, hasUnitSuffix: matchedSuffix !== undefined };
    }
  }
  return null;
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        '类型成员中的数值量纲字段（金额 / 时长 / 时间点 / 长度 / 数据量 / 质量）必须带单位后缀，如 fee 写作 feeCents、timeout 写作 timeoutMs',
    },
    schema: [
      {
        type: 'object',
        properties: {
          dimensions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', minLength: 1 },
                // 空数组会让该量纲静默失效；suffixes 为空还会让建议渲染成 `timeoutundefined`
                roots: { type: 'array', items: { type: 'string', minLength: 1 }, minItems: 1 },
                suffixes: { type: 'array', items: { type: 'string', minLength: 1 }, minItems: 1 },
              },
              required: ['name', 'roots', 'suffixes'],
              additionalProperties: false,
            },
            minItems: 1,
            default: DEFAULT_OPTIONS.dimensions,
          },
          ignoredFields: {
            type: 'array',
            items: { type: 'string' },
            default: DEFAULT_OPTIONS.ignoredFields,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingUnit:
        '{{dimension}}字段 `{{name}}` 未标明单位，请改用带单位后缀的命名（{{suffixes}}），如 `{{suggestion}}`；单位只写在注释里迟早会被跨端误解',
    },
  },
  create(context) {
    const { dimensions, ignoredFields } = { ...DEFAULT_OPTIONS, ...context.options[0] };
    const ignored = new Set(ignoredFields);

    return {
      'TSPropertySignature > Identifier.key'(node) {
        const property = node.parent;
        if (property.computed) {
          return;
        }

        const fieldName = node.name;
        if (ignored.has(fieldName)) {
          return;
        }
        if (!isNumericAnnotation(property.typeAnnotation?.typeAnnotation)) {
          return;
        }

        const matched = matchDimension(fieldName, dimensions);
        if (matched === null || matched.hasUnitSuffix) {
          return;
        }

        const { name: dimensionName, suffixes } = matched.dimension;

        context.report({
          node,
          messageId: 'missingUnit',
          data: {
            dimension: dimensionName,
            name: fieldName,
            suffixes: suffixes.join(' / '),
            suggestion: `${fieldName}${suffixes[0]}`,
          },
        });
      },
    };
  },
};
