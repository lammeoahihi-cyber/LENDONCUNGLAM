
import { ColumnMapping } from './types';

export const DA_KHO_MAPPINGS: ColumnMapping[] = [
  { source: 'BB', target: 'A' },
  { source: 'BD', target: 'B' },
  { source: 'BH', target: 'C' },
  { source: 'G', target: 'D' },
  { source: 'A', target: 'E' },
  { source: 'T', target: 'F' },
  { source: 'AC', target: 'G' },
  { source: 'AA', target: 'H' },
  { source: 'BJ', target: 'J' }, 
  { source: 'H', target: 'L' }, 
];

export const MOT_KHO_MAPPINGS: ColumnMapping[] = [
  { source: 'BA', target: 'A' },
  { source: 'BC', target: 'B' },
  { source: 'BG', target: 'C' },
  { source: 'G', target: 'D' },
  { source: 'A', target: 'E' },
  { source: 'S', target: 'F' },
  { source: 'AB', target: 'G' },
  { source: 'Z', target: 'H' },
  { source: 'BI', target: 'J' }, 
  { source: 'H', target: 'L' }, 
];

export const TIKTOK_MAPPINGS: ColumnMapping[] = [
  { source: 'AM', target: 'A' },
  { source: 'AO', target: 'B' },
  { source: 'AQ', target: 'C' },
  { source: 'AI', target: 'D' },
  { source: 'A', target: 'E' },
  { source: 'G', target: 'F' },
  { source: 'P', target: 'G' },
  { source: 'J', target: 'H' },
  { source: 'N', target: 'K' },
  { source: 'AK', target: 'L' }, // Cập nhật: AK tới L
];

export const ACCEPTED_FILE_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
];
