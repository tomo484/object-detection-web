import { NextResponse } from 'next/server';
import type { ApiResponse, ApiError } from './dto';

// 成功レスポンス生成
export function createSuccessResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
  });
}

// エラーレスポンス生成
export function createErrorResponse(
  error: string | ApiError,
  status: number = 500
): NextResponse<ApiResponse> {
  const errorObj = typeof error === 'string' 
    ? { code: 'INTERNAL_ERROR', message: error }
    : error;

  return NextResponse.json(
    {
      success: false,
      error: errorObj.message,
    },
    { status }
  );
}

// ログ出力（構造化ログ）
export function logInfo(message: string, data?: unknown): void {
  console.log(JSON.stringify({
    level: 'info',
    message,
    data,
    timestamp: new Date().toISOString(),
  }));
}

export function logError(message: string, error?: unknown): void {
  console.error(JSON.stringify({
    level: 'error',
    message,
    error: error instanceof Error ? error.message : error,
    timestamp: new Date().toISOString(),
  }));
}

// リクエストID生成
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
} 