
export type Platform = 'shopee' | 'tiktok';

export interface ColumnMapping {
  source: string;
  target: string;
}

export interface ProcessingState {
  status: 'idle' | 'processing' | 'success' | 'error';
  message: string;
}

export interface HistoryItem {
  id: string;
  type: 'upload' | 'download';
  filename: string;
  timestamp: number;
  platform?: Platform;
  size?: number;
  count?: number; 
}
