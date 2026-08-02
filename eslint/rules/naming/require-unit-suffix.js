/*
 * 数值量纲字段必须带单位后缀。金额、时长、尺寸只写 price / duration / size 时，
 * 单位就只活在口头约定和注释里：接口给「分」、卡片按「元」渲染，一次误解就是 100 倍的金额事故。
 *
 * 只校验类型成员（interface / type 的字段）：它们是跨端、跨模块传递的契约，单位歧义在这里代价最大；
 * 局部变量与函数参数不校验，否则噪音会铺满整个代码库，而它们的生命周期短、上下文就在眼前。
 */

// 量纲：词根命中且类型为数值时，字段名必须以其中一个单位后缀结尾
const DEFAULT_DIMENSIONS = [
  {
    name: '金额',
    roots: ['price', 'amount', 'fee', 'cost', 'balance', 'salary', 'discount', 'deposit'],
    suffixes: ['Cents', 'Yuan'],
  },
  {
    name: '时长',
    roots: ['duration', 'timeout', 'delay', 'interval', 'elapsed', 'expires'],
    suffixes: ['Ms', 'Seconds', 'Minutes', 'Hours', 'Days'],
  },
  {
    name: '尺寸',
    roots: ['size', 'width', 'height', 'length', 'distance', 'weight'],
    suffixes: ['Px', 'Rem', 'Percent', 'Bytes', 'Kb', 'Mb', 'Grams', 'Kg'],
  },
];

// 选项默认值的唯一来源：schema 的 default 与 create 里的取值都引用此处
const DEFAULT_OPTIONS = {
  dimensions: DEFAULT_DIMENSIONS,
  ignoredFields: [],
};

// 数值类型判定停留在语法层：number 本体，或联合类型里含 number（price: number | null）
function isNumericAnnotation(annotation) {
  if (annotation == null) return false;
  if (annotation.type === 'TSNumberKeyword') return true;
  if (annotation.type === 'TSUnionType') return annotation.types.some(isNumericAnnotation);
  return false;
}

/*
 * 先剥掉尾部的单位后缀，再看剩下的部分是否以词根结尾：
 * priceCents 剥成 price（命中且已带单位，合规），price 剥不掉（命中但没单位，报错），
 * unitPrice / totalAmount 这类复合命名也一并命中。
 * 代价是未登记的单位写法（priceFen）识别不出来，属于有意的漏报换低噪音——补 dimensions 即可覆盖。
 */
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
        '类型成员中的数值量纲字段（金额 / 时长 / 尺寸）必须带单位后缀，如 priceInCents 写作 priceCents、timeout 写作 timeoutMs',
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          dimensions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                roots: { type: 'array', items: { type: 'string' } },
                suffixes: { type: 'array', items: { type: 'string' } },
              },
              required: ['name', 'roots', 'suffixes'],
              additionalProperties: false,
            },
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
        if (property.computed) return;

        const fieldName = node.name;
        if (ignored.has(fieldName)) return;
        if (!isNumericAnnotation(property.typeAnnotation?.typeAnnotation)) return;

        const matched = matchDimension(fieldName, dimensions);
        if (matched === null || matched.hasUnitSuffix) return;

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
