
import * as XLSX from 'xlsx';
import { MOT_KHO_MAPPINGS, DA_KHO_MAPPINGS, TIKTOK_MAPPINGS } from '../constants';
import { ColumnMapping, Platform } from '../types';

/**
 * Converts Excel column string (e.g., 'A', 'BB') to 0-based index.
 */
function columnToIndex(column: string): number {
  let index = 0;
  const upperCol = column.toUpperCase();
  for (let i = 0; i < upperCol.length; i++) {
    index = index * 26 + (upperCol.charCodeAt(i) - 64);
  }
  return index - 1;
}

/**
 * Detects Shopee subtype: "Đơn Đa Kho" or "Đơn 1 Kho"
 */
function detectShopeeMappingType(rows: any[][]): ColumnMapping[] {
  if (rows.length === 0) return MOT_KHO_MAPPINGS;
  const searchLimit = Math.min(rows.length, 5);
  for (let i = 0; i < searchLimit; i++) {
    const row = rows[i];
    if (Array.isArray(row)) {
      const hasKeyword = row.some(cell => 
        cell !== null && cell !== undefined && 
        String(cell).toLowerCase().includes('tên kho hàng')
      );
      if (hasKeyword) return DA_KHO_MAPPINGS;
    }
  }
  return MOT_KHO_MAPPINGS;
}

export async function processExcelFiles(files: File[], platform: Platform): Promise<Blob> {
  const mergedRows: any[][] = [];
  let isFirstFile = true;

  for (const file of files) {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

    if (jsonData.length === 0) continue;

    let mappings: ColumnMapping[];
    if (platform === 'shopee') {
      mappings = detectShopeeMappingType(jsonData);
    } else {
      mappings = TIKTOK_MAPPINGS;
    }

    const startRow = isFirstFile ? 0 : 1;

    for (let i = startRow; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      // Xác định kích thước hàng: Tiktok cần tới cột AK (index 36)
      const maxTargetIdx = Math.max(...mappings.map(m => columnToIndex(m.target)));
      const newRow: any[] = new Array(maxTargetIdx + 1).fill(null); 

      mappings.forEach((mapping) => {
        const sourceIdx = columnToIndex(mapping.source);
        const targetIdx = columnToIndex(mapping.target);
        
        let val = row[sourceIdx] !== undefined ? row[sourceIdx] : '';

        // Shopee specific: Clean .00 from column G
        if (platform === 'shopee' && mapping.target === 'G') {
          if (val !== null && val !== undefined) {
            val = String(val).trim().replace(/\.00$/, '');
          }
        }
        
        if (targetIdx >= 0 && targetIdx < newRow.length) {
          newRow[targetIdx] = val;
        }
      });
      mergedRows.push(newRow);
    }
    isFirstFile = false;
  }

  if (mergedRows.length === 0) {
    throw new Error("Không tìm thấy dữ liệu hợp lệ.");
  }

  const newWorksheet = XLSX.utils.aoa_to_sheet(mergedRows);
  const newWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, `TỔNG HỢP ${platform.toUpperCase()}`);

  const out = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
