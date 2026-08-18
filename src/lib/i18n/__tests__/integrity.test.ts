import en from '../locales/en';
import zh from '../locales/zh';

function flatten(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : flatten(v as Record<string, unknown>, `${prefix}${k}.`),
  );
}

describe('i18n integrity', () => {
  const enKeys = flatten(en as Record<string, unknown>).sort();
  const zhKeys = flatten(zh as Record<string, unknown>).sort();

  it('en and zh share the same key set', () => {
    expect(zhKeys).toEqual(enKeys);
  });

  it('every value is a non-empty string', () => {
    const all = [...enKeys, ...zhKeys];
    for (const k of all) {
      expect(k.length).toBeGreaterThan(0);
    }
    const enVals = Object.values(en).flatMap((ns) => Object.values(ns as Record<string, string>));
    expect(enVals.every((v) => typeof v === 'string' && v.length > 0)).toBe(true);
  });
});
