export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface OcrResult {
  readingId: string;
  uuid: string;
  imageUrl: string;
  type: 'digital' | 'analog';
  value: string;
  confidence: number;
  processingTime: number;
  preprocessingAttempts: number;
  totalLinesDetected: number;
  numericCandidates: number;
  createdAt: string;
}

export interface OcrRequest {
  imageBase64: string;
  uuid: string;
}

export interface ReadingsResponse {
  readings: OcrResult[];
  total: number;
}

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

export interface MlApiRequest {
  image_base64: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
} 