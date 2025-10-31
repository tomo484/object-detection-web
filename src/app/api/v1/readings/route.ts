import { createSuccessResponse, createErrorResponse, logInfo, logError } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import type { ReadingsResponse, OcrResult } from '@/lib/dto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const uuid = searchParams.get('uuid');

    logInfo('Readings list requested', { limit, uuid });

    // クエリ条件
    const where = uuid ? { uuid } : {};

    // 履歴取得
    const readings = await prisma.reading.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 50), // 最大50件
    });

    // 総数取得
    const total = await prisma.reading.count({ where });

    // レスポンス形式に変換
    const formattedReadings: OcrResult[] = readings.map((reading) => ({
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
    }));

    const response: ReadingsResponse = {
      readings: formattedReadings,
      total,
    };

    logInfo('Readings list completed', { count: formattedReadings.length, total });
    return createSuccessResponse(response);
  } catch (error) {
    logError('Failed to get readings list', error);
    return createErrorResponse('Failed to get readings list', 500);
  }
} 