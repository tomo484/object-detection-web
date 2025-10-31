import { createSuccessResponse, createErrorResponse, logInfo, logError, generateId } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import type { OcrRequest, OcrResult } from '@/lib/dto';

export async function POST(request: Request) {
  try {
    const body: OcrRequest = await request.json();
    const { imageBase64, uuid } = body;

    if (!imageBase64 || !uuid) {
      return createErrorResponse('Missing required fields: imageBase64, uuid', 400);
    }

    logInfo('Mock OCR request received', { uuid, imageLength: imageBase64.length });

    // モック用の固定値とランダム値
    const mockValues = ['12:34', '56.78', '90.12', '34:56:78', '123.45'];
    const randomValue = mockValues[Math.floor(Math.random() * mockValues.length)];
    const processingTime = 10 + Math.random() * 20; // 10-30秒の範囲
    const preprocessingAttempts = Math.floor(Math.random() * 3) + 1; // 1-3回
    const totalLinesDetected = Math.floor(Math.random() * 8) + 3; // 3-10行
    const numericCandidates = Math.floor(Math.random() * 5) + 1; // 1-5個
    const confidence = Math.max(0.1, Math.min(0.99, 1 - (processingTime / 100))); // processing_timeから計算

    // 読み取り結果ID生成
    const readingId = generateId();

    // モック画像URL（実際のプロジェクトではAzure Blob Storageを使用）
    const imageUrl = `https://example.com/images/${readingId}.jpg`;

    // データベースに保存
    const reading = await prisma.reading.create({
      data: {
        readingId,
        uuid,
        imageUrl,
        type: 'digital',
        value: randomValue,
        confidence,
        processingTime,
        preprocessingAttempts,
        totalLinesDetected,
        numericCandidates,
      },
    });

    // レスポンス形式に変換
    const response: OcrResult = {
      readingId: reading.readingId,
      uuid: reading.uuid,
      imageUrl: reading.imageUrl,
      type: reading.type as 'digital' | 'analog',
      value: reading.value,
      confidence: reading.confidence,
      processingTime: reading.processingTime,
      preprocessingAttempts: reading.preprocessingAttempts,
      totalLinesDetected: reading.totalLinesDetected,
      numericCandidates: reading.numericCandidates,
      createdAt: reading.createdAt.toISOString(),
    };

    logInfo('Mock OCR completed', { 
      readingId, 
      value: randomValue, 
      processingTime,
      preprocessingAttempts 
    });
    return createSuccessResponse(response);
  } catch (error) {
    logError('Mock OCR failed', error);
    return createErrorResponse('OCR processing failed', 500);
  }
} 