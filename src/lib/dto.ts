// API共通レスポンス型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// OCR結果型
export interface OcrResult {
  readingId: string;
  uuid: string;
  imageUrl: string;
  type: 'digital' | 'analog';
  value: string; // text_normalized
  confidence: number; // 後方互換性のため保持
  processingTime: number;
  preprocessingAttempts: number;
  totalLinesDetected: number;
  numericCandidates: number;
  createdAt: string;
}

// OCRリクエスト型
export interface OcrRequest {
  imageBase64: string;
  uuid: string;
}

// 履歴一覧レスポンス型
export interface ReadingsResponse {
  readings: OcrResult[];
  total: number;
}

// 新しいML APIレスポンス型
export interface MlApiResponse {
  success: boolean;
  result: {
    text_normalized: string;
    preprocessing_attempts: number;
  };
  processing_time: number;
  metadata: {
    total_lines_detected: number;
    numeric_candidates: number;
  };
}

// ML APIリクエスト型
export interface MlApiRequest {
  image_base64: string;
}

// エラー型
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
} 