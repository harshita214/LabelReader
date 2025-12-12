export interface LabelData {
  item_name: string;
  expiry: string;
  usage: string;
  warnings: string;
  ingredients: string;
  confidence_score?: number; // 0 to 1
  is_medicine?: boolean;
  // New fields
  visual_details?: string; // Color, shape, packaging (non-medicine)
  seal_status?: string;   // Sealed/Opened (non-medicine)
  quantity_estimate?: string; // How many left (medicine)
}

export enum AppState {
  IDLE = 'IDLE',
  CAMERA = 'CAMERA',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}

export interface AnalysisResult {
  data?: LabelData;
  error?: string;
}

export type LanguageCode = 'en' | 'hi';