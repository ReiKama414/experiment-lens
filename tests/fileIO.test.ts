import { describe, it, expect } from 'vitest';
import { parseCSVToVariants, parseJSONToExperiment } from '../src/utils/fileIO';

describe('File Import & Export Edge Cases Tests', () => {
  it('rejects empty and whitespace-only files', () => {
    expect(parseCSVToVariants('').success).toBe(false);
    expect(parseCSVToVariants('   \n  \t  ').success).toBe(false);

    expect(parseJSONToExperiment('').success).toBe(false);
    expect(parseJSONToExperiment('   ').success).toBe(false);
  });

  it('rejects malformed CSV with insufficient rows', () => {
    const singleRow = 'group,visitors,conversions\nControl,1000,50';
    const res = parseCSVToVariants(singleRow);
    expect(res.success).toBe(false);
    expect(res.error).toContain('至少需要');
  });

  it('rejects abnormal CSV data where conversions > visitors', () => {
    const invalidCSV = `variant,visitors,conversions\nControl,100,50\nTreatment,100,150`;
    const res = parseCSVToVariants(invalidCSV);
    expect(res.success).toBe(false);
    expect(res.error).toContain('大於訪客數');
  });

  it('rejects CSV with negative or non-numeric values', () => {
    const invalidCSV = `variant,visitors,conversions\nControl,abc,50\nTreatment,100,10`;
    const res = parseCSVToVariants(invalidCSV);
    expect(res.success).toBe(false);
    expect(res.error).toContain('非正整數');
  });

  it('correctly parses valid CSV with comma, semicolon, or tab delimiters', () => {
    const commaCSV = `name,visitors,conversions,is_control\n舊版,20000,1000,true\n新版,20000,1200,false`;
    const resComma = parseCSVToVariants(commaCSV);
    expect(resComma.success).toBe(true);
    expect(resComma.data?.length).toBe(2);
    expect(resComma.data?.[0].isControl).toBe(true);

    const semiCSV = `name;visitors;conversions\nA;5000;200\nB;5000;250`;
    const resSemi = parseCSVToVariants(semiCSV);
    expect(resSemi.success).toBe(true);
    expect(resSemi.data?.length).toBe(2);
  });

  it('handles corrupted JSON syntax safely without crashing', () => {
    const corrupted = '{"name": "test", "variants": [invalid json';
    const res = parseJSONToExperiment(corrupted);
    expect(res.success).toBe(false);
    expect(res.error).toContain('語法解析失敗');
  });

  it('validates JSON structure and extracts clean experiment record', () => {
    const validJSON = JSON.stringify({
      name: '結帳頁測試',
      variants: [
        { name: 'Control', visitors: 1000, conversions: 50, isControl: true },
        { name: 'Treatment', visitors: 1000, conversions: 70, isControl: false },
      ],
      settings: {
        confidenceLevel: 0.99,
        hypothesisDirection: 'greater',
      },
    });

    const res = parseJSONToExperiment(validJSON);
    expect(res.success).toBe(true);
    expect(res.data?.name).toBe('結帳頁測試');
    expect(res.data?.variants.length).toBe(2);
    expect(res.data?.settings.confidenceLevel).toBe(0.99);
  });
});
