import { RuleTester } from 'eslint';
import { describe, expect, it } from 'vitest';
import plugin, { findPhysicalClasses } from './logical-properties.js';

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run('logical-properties', plugin.rules['logical-properties'], {
  valid: [
    '<div className="ms-4 pe-2 start-0 text-start border-s rounded-ss" />',
    '<div className="md:ms-4 hover:pe-2 rtl:-scale-x-100" />',
    '<View style={{ marginStart: 8, paddingEnd: 4, start: 0, textAlign: "center" }} />',
    // `left` outside a style context is ordinary data, not layout.
    'const pair = { left: 1, right: 2 };',
    '<div className={cn("ms-2", active && "pe-4")} />',
    '<div className="overflow-left-safe" />',
  ],
  invalid: [
    { code: '<div className="ml-4" />', errors: [{ messageId: 'className' }] },
    { code: '<div className="md:pr-2" />', errors: [{ messageId: 'className' }] },
    { code: '<div className="-left-2 text-right" />', errors: 2 },
    { code: '<div className="border-l-2 rounded-tr-lg" />', errors: 2 },
    { code: '<div className={`flex ${x} pl-3`} />', errors: [{ messageId: 'className' }] },
    { code: '<div className={cn("p-2", open ? "mr-1" : "ms-1")} />', errors: 1 },
    { code: '<View style={{ marginLeft: 8 }} />', errors: [{ messageId: 'styleKey' }] },
    { code: '<View style={{ left: 0, textAlign: "right" }} />', errors: 2 },
    { code: 'StyleSheet.create({ box: { right: 4 } })', errors: [{ messageId: 'styleKey' }] },
    { code: 'const s = { paddingRight: 4 };', errors: [{ messageId: 'styleKey' }] },
  ],
});

describe('findPhysicalClasses', () => {
  it('suggests the logical equivalent and keeps variants', () => {
    expect(findPhysicalClasses('md:ml-4 rounded-bl-xl')).toEqual([
      { cls: 'md:ml-4', suggestion: 'md:ms-4' },
      { cls: 'rounded-bl-xl', suggestion: 'rounded-es-xl' },
    ]);
  });
});
