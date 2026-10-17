// ESLint plugin: layout must use logical (start/end) properties, never physical (left/right).
// SPEC section 7: "Feature code uses logical properties only."
//
// Checks two things:
//   1. Tailwind classes in className strings (ml-4, pr-2, left-0, text-right, border-l, rounded-tr...).
//   2. Style objects (marginLeft, paddingRight, left, textAlign: 'right'...).

const CLASS_RULES = [
  // [pattern on the bare utility, logical replacement]
  [/^-?ml-/, (c) => c.replace('ml-', 'ms-')],
  [/^-?mr-/, (c) => c.replace('mr-', 'me-')],
  [/^pl-/, (c) => c.replace('pl-', 'ps-')],
  [/^pr-/, (c) => c.replace('pr-', 'pe-')],
  [/^-?left-/, (c) => c.replace('left-', 'start-')],
  [/^-?right-/, (c) => c.replace('right-', 'end-')],
  [/^scroll-ml-/, (c) => c.replace('scroll-ml-', 'scroll-ms-')],
  [/^scroll-mr-/, (c) => c.replace('scroll-mr-', 'scroll-me-')],
  [/^scroll-pl-/, (c) => c.replace('scroll-pl-', 'scroll-ps-')],
  [/^scroll-pr-/, (c) => c.replace('scroll-pr-', 'scroll-pe-')],
  [/^text-left$/, () => 'text-start'],
  [/^text-right$/, () => 'text-end'],
  [/^float-left$/, () => 'float-start'],
  [/^float-right$/, () => 'float-end'],
  [/^clear-left$/, () => 'clear-start'],
  [/^clear-right$/, () => 'clear-end'],
  [/^border-l(-|$)/, (c) => c.replace('border-l', 'border-s')],
  [/^border-r(-|$)/, (c) => c.replace('border-r', 'border-e')],
  [/^rounded-l(-|$)/, (c) => c.replace('rounded-l', 'rounded-s')],
  [/^rounded-r(-|$)/, (c) => c.replace('rounded-r', 'rounded-e')],
  [/^rounded-tl(-|$)/, (c) => c.replace('rounded-tl', 'rounded-ss')],
  [/^rounded-tr(-|$)/, (c) => c.replace('rounded-tr', 'rounded-se')],
  [/^rounded-bl(-|$)/, (c) => c.replace('rounded-bl', 'rounded-es')],
  [/^rounded-br(-|$)/, (c) => c.replace('rounded-br', 'rounded-ee')],
];

// Unambiguous physical style keys: flagged in any object literal.
const STYLE_KEYS = {
  marginLeft: 'marginStart',
  marginRight: 'marginEnd',
  paddingLeft: 'paddingStart',
  paddingRight: 'paddingEnd',
  borderLeftWidth: 'borderStartWidth',
  borderRightWidth: 'borderEndWidth',
  borderLeftColor: 'borderStartColor',
  borderRightColor: 'borderEndColor',
  borderTopLeftRadius: 'borderTopStartRadius',
  borderTopRightRadius: 'borderTopEndRadius',
  borderBottomLeftRadius: 'borderBottomStartRadius',
  borderBottomRightRadius: 'borderBottomEndRadius',
};

// Ambiguous keys (`left`, `right`, `textAlign`): flagged only inside style={...} or StyleSheet.create(...).
const POSITION_KEYS = { left: 'start', right: 'end' };

function bareUtility(cls) {
  // Strip variants (md:, hover:, rtl:...) and the important modifier.
  const parts = cls.split(':');
  return parts[parts.length - 1].replace(/^!/, '').replace(/!$/, '');
}

function findPhysicalClasses(value) {
  const hits = [];
  for (const cls of value.split(/\s+/)) {
    if (!cls) continue;
    const bare = bareUtility(cls);
    for (const [pattern, fix] of CLASS_RULES) {
      if (pattern.test(bare)) {
        hits.push({ cls, suggestion: cls.replace(bare, fix(bare)) });
        break;
      }
    }
  }
  return hits;
}

function keyName(prop) {
  if (prop.type !== 'Property' || prop.computed) return null;
  if (prop.key.type === 'Identifier') return prop.key.name;
  if (prop.key.type === 'Literal' && typeof prop.key.value === 'string') return prop.key.value;
  return null;
}

function isStyleContext(node) {
  for (let cur = node.parent; cur; cur = cur.parent) {
    if (cur.type === 'JSXAttribute') return cur.name && /style$/i.test(cur.name.name ?? '');
    if (
      cur.type === 'CallExpression' &&
      cur.callee.type === 'MemberExpression' &&
      cur.callee.object.type === 'Identifier' &&
      cur.callee.object.name === 'StyleSheet'
    ) {
      return true;
    }
    if (cur.type === 'Program' || cur.type === 'FunctionDeclaration') return false;
  }
  return false;
}

const rule = {
  meta: {
    type: 'problem',
    docs: { description: 'Require logical (start/end) layout properties instead of left/right' },
    messages: {
      className: 'Use the logical class "{{suggestion}}" instead of "{{cls}}" (SPEC section 7).',
      styleKey: 'Use "{{suggestion}}" instead of "{{key}}" (SPEC section 7).',
      textAlign: 'Use textAlign "{{suggestion}}" instead of "{{value}}" (SPEC section 7).',
    },
    schema: [],
  },
  create(context) {
    // A string can be reached twice (className={cn(...)} visits cn() as a call too).
    const seen = new WeakSet();

    function checkString(node, value) {
      if (seen.has(node)) return;
      seen.add(node);
      for (const hit of findPhysicalClasses(value)) {
        context.report({ node, messageId: 'className', data: hit });
      }
    }

    function checkClassValue(node) {
      if (!node) return;
      if (node.type === 'Literal' && typeof node.value === 'string') checkString(node, node.value);
      else if (node.type === 'TemplateLiteral') {
        for (const q of node.quasis) checkString(q, q.value.cooked ?? '');
      } else if (node.type === 'JSXExpressionContainer') checkClassValue(node.expression);
      else if (node.type === 'ConditionalExpression') {
        checkClassValue(node.consequent);
        checkClassValue(node.alternate);
      } else if (node.type === 'LogicalExpression') checkClassValue(node.right);
      else if (node.type === 'CallExpression') node.arguments.forEach(checkClassValue);
      else if (node.type === 'ArrayExpression') node.elements.forEach(checkClassValue);
    }

    return {
      JSXAttribute(node) {
        const name = node.name?.name;
        if (typeof name === 'string' && /className$/.test(name)) checkClassValue(node.value);
      },
      CallExpression(node) {
        // cn(), clsx(), cva() and similar class helpers.
        if (node.callee.type === 'Identifier' && /^(cn|clsx|cx|cva|tw)$/.test(node.callee.name)) {
          node.arguments.forEach(checkClassValue);
        }
      },
      Property(node) {
        const key = keyName(node);
        if (!key) return;
        if (key in STYLE_KEYS) {
          context.report({
            node: node.key,
            messageId: 'styleKey',
            data: { key, suggestion: STYLE_KEYS[key] },
          });
          return;
        }
        if (!isStyleContext(node)) return;
        if (key in POSITION_KEYS) {
          context.report({
            node: node.key,
            messageId: 'styleKey',
            data: { key, suggestion: POSITION_KEYS[key] },
          });
        } else if (
          key === 'textAlign' &&
          node.value.type === 'Literal' &&
          (node.value.value === 'left' || node.value.value === 'right')
        ) {
          context.report({
            node: node.value,
            messageId: 'textAlign',
            data: {
              value: node.value.value,
              suggestion: node.value.value === 'left' ? 'start' : 'end',
            },
          });
        }
      },
    };
  },
};

export { findPhysicalClasses };

export default {
  meta: { name: 'eslint-plugin-murshid' },
  rules: { 'logical-properties': rule },
};
