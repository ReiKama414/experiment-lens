import type { Variant, ExperimentRecord } from '../types/experiment';

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

/**
 * Robust CSV parser that handles delimiters, quotes, large text, and validates schemas.
 */
export function parseCSVToVariants(csvContent: string): ParseResult<Variant[]> {
  if (!csvContent || !csvContent.trim()) {
    return { success: false, error: '檔案內容為空，請選擇含有數據的 CSV 檔案。' };
  }

  // Check file size / line count limit
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      success: false,
      error: 'CSV 資料列不足：至少需要標題列與 2 個變體組別數據。',
    };
  }

  if (lines.length > 5000) {
    return {
      success: false,
      error: '檔案過大：目前單一實驗支援上限為 5,000 列數據。',
    };
  }

  // Detect delimiter: comma, semicolon, tab
  const headerLine = lines[0];
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semiCount = (headerLine.match(/;/g) || []).length;
  const tabCount = (headerLine.match(/\t/g) || []).length;

  let delimiter = ',';
  if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
  if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';

  // Split line with quote awareness
  const splitCSVRow = (row: string): string[] => {
    const pattern = new RegExp(
      `(?:^|\\${delimiter})(?:"([^"]*(?:""[^"]*)*)"|([^"\\${delimiter}]*))`,
      'g'
    );
    const fields: string[] = [];
    let match;
    while ((match = pattern.exec(row)) !== null) {
      let val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
      fields.push(val ? val.trim() : '');
    }
    return fields;
  };

  const headers = splitCSVRow(headerLine).map((h) => h.toLowerCase().replace(/[\s_"]/g, ''));

  // Column matching heuristics
  let nameCol = headers.findIndex((h) =>
    ['name', 'group', 'variant', '組別', '組別名稱', '名稱', 'variantname'].includes(h)
  );
  let visitorsCol = headers.findIndex((h) =>
    ['visitors', 'visitor', 'users', 'user', 'n', 'impressions', 'traffic', '訪客數', '樣本數', '人數'].includes(h)
  );
  let conversionsCol = headers.findIndex((h) =>
    ['conversions', 'conversion', 'converted', 'successes', 'x', 'events', '轉換數', '成功數', '成功件數'].includes(h)
  );
  let isControlCol = headers.findIndex((h) =>
    ['control', 'iscontrol', 'is_control', '對照組', '基準組', '基準'].includes(h)
  );
  let weightCol = headers.findIndex((h) =>
    ['weight', 'trafficpercent', 'expectedtrafficpercent', 'expected', '預期分流', '預期比例'].includes(h)
  );

  // Fallback to positional mapping if headers missing
  if (nameCol === -1 && visitorsCol === -1 && conversionsCol === -1) {
    nameCol = 0;
    visitorsCol = 1;
    conversionsCol = 2;
  } else if (visitorsCol === -1 || conversionsCol === -1) {
    return {
      success: false,
      error:
        'CSV 格式錯誤：未檢測到必要欄位。請確保包含「訪客數 (visitors / N)」與「轉換數 (conversions / x)」欄位。',
    };
  }

  const variants: Variant[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawFields = splitCSVRow(lines[i]);
    if (rawFields.length <= Math.max(visitorsCol, conversionsCol)) {
      continue; // Skip malformed trailing lines
    }

    const name = nameCol !== -1 && rawFields[nameCol] ? rawFields[nameCol] : `組別 ${i}`;
    const rawVisitors = rawFields[visitorsCol];
    const rawConversions = rawFields[conversionsCol];

    const visitors = parseInt(rawVisitors.replace(/,/g, ''), 10);
    const conversions = parseInt(rawConversions.replace(/,/g, ''), 10);

    if (isNaN(visitors) || visitors <= 0) {
      return {
        success: false,
        error: `第 ${i + 1} 列資料錯誤：訪客數「${rawVisitors}」非正整數。`,
      };
    }

    if (isNaN(conversions) || conversions < 0) {
      return {
        success: false,
        error: `第 ${i + 1} 列資料錯誤：轉換數「${rawConversions}」非有效非負整數。`,
      };
    }

    if (conversions > visitors) {
      return {
        success: false,
        error: `第 ${i + 1} 列資料異常：轉換數 (${conversions}) 大於訪客數 (${visitors})。`,
      };
    }

    let isControl = false;
    if (isControlCol !== -1 && rawFields[isControlCol]) {
      const v = rawFields[isControlCol].toLowerCase();
      isControl = ['true', 'yes', 'y', '1', '是', '對照組', 'control'].includes(v);
    } else if (i === 1) {
      isControl = true; // Default first row as control
    }

    let weight = 50;
    if (weightCol !== -1 && rawFields[weightCol]) {
      const parsedWeight = parseFloat(rawFields[weightCol]);
      if (!isNaN(parsedWeight) && parsedWeight > 0) {
        weight = parsedWeight;
      }
    }

    variants.push({
      id: `var-${Date.now()}-${i}`,
      name,
      visitors,
      conversions,
      expectedTrafficPercent: weight,
      isControl,
    });
  }

  if (variants.length < 2) {
    return {
      success: false,
      error: '有效變體組數不足：至少需要 2 組有效數據以進行 A/B 比較。',
    };
  }

  // Ensure exactly one control exists
  if (!variants.some((v) => v.isControl)) {
    variants[0].isControl = true;
    warnings.push('未指定對照組，已預設第一組為對照基準。');
  }

  return { success: true, data: variants, warnings };
}

/**
 * Robust JSON parser that handles ExperimentRecord, array of records, or raw variants.
 */
export function parseJSONToExperiment(jsonContent: string): ParseResult<ExperimentRecord> {
  if (!jsonContent || !jsonContent.trim()) {
    return { success: false, error: '檔案內容為空，請選擇非空的 JSON 檔案。' };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonContent);
  } catch (err: any) {
    return {
      success: false,
      error: `JSON 語法解析失敗：${err.message || '請確認檔案符合標準 JSON 格式'}`,
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { success: false, error: 'JSON 根節點必須是物件或陣列。' };
  }

  // Case 1: Snapshot / Single ExperimentRecord
  let rawRecord = Array.isArray(parsed) ? parsed[0] : parsed;

  if (rawRecord.variants && Array.isArray(rawRecord.variants)) {
    if (rawRecord.variants.length < 2) {
      return {
        success: false,
        error: '變體資料異常：實驗至少需要包含 2 組變體。',
      };
    }

    const cleanVariants: Variant[] = [];
    for (let idx = 0; idx < rawRecord.variants.length; idx++) {
      const v = rawRecord.variants[idx];
      const visitors = Math.max(0, parseInt(v.visitors) || 0);
      const conversions = Math.max(0, parseInt(v.conversions) || 0);

      if (visitors <= 0) {
        return {
          success: false,
          error: `組別「${v.name || idx + 1}」訪客數為 0 或非正整數。`,
        };
      }
      if (conversions > visitors) {
        return {
          success: false,
          error: `組別「${v.name || idx + 1}」轉換數大於訪客數。`,
        };
      }

      cleanVariants.push({
        id: v.id || `var-${Date.now()}-${idx}`,
        name: v.name || `組別 ${idx + 1}`,
        visitors,
        conversions,
        expectedTrafficPercent: parseFloat(v.expectedTrafficPercent) || 50,
        isControl: Boolean(v.isControl),
        notes: v.notes || '',
      });
    }

    if (!cleanVariants.some((v) => v.isControl)) {
      cleanVariants[0].isControl = true;
    }

    const now = Date.now();
    const cleanRecord: ExperimentRecord = {
      id: rawRecord.id || `exp-${now}-${Math.random().toString(36).substring(2, 7)}`,
      name: rawRecord.name || rawRecord.experimentName || '匯入實驗設定',
      metricName: rawRecord.metricName || '轉換率',
      description: rawRecord.description || '',
      status: ['draft', 'running', 'concluded', 'archived'].includes(rawRecord.status)
        ? rawRecord.status
        : 'draft',
      createdAt: typeof rawRecord.createdAt === 'number' ? rawRecord.createdAt : now,
      updatedAt: now,
      variants: cleanVariants,
      settings: {
        experimentName:
          rawRecord.settings?.experimentName ||
          rawRecord.name ||
          rawRecord.experimentName ||
          '匯入實驗設定',
        metricName: rawRecord.settings?.metricName || rawRecord.metricName || '轉換率',
        confidenceLevel: rawRecord.settings?.confidenceLevel || 0.95,
        hypothesisDirection: rawRecord.settings?.hypothesisDirection || 'two-sided',
        useContinuityCorrection: Boolean(rawRecord.settings?.useContinuityCorrection),
        enableMultipleTestingCorrection: Boolean(
          rawRecord.settings?.enableMultipleTestingCorrection
        ),
      },
      tags: Array.isArray(rawRecord.tags) ? rawRecord.tags.map(String) : [],
    };

    return { success: true, data: cleanRecord };
  }

  return {
    success: false,
    error: '未知的 JSON 結構：請確保包含「variants」組別資料。',
  };
}

/**
 * Triggers a real browser file download for text/blob content.
 */
export function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType: string = 'text/plain'
): void {
  const blob = typeof content === 'string' ? new Blob([content], { type: `${mimeType};charset=utf-8;` }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
