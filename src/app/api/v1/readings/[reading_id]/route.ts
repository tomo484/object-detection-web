import { createSuccessResponse, createErrorResponse, logInfo, logError } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import type { OcrResult } from '@/lib/dto';

interface RouteParams {
  params: Promise<{ reading_id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { reading_id } = await params;
    
    logInfo('Reading detail requested', { reading_id });

    const reading = await prisma.reading.findUnique({
      where: { readingId: reading_id },
    });

    if (!reading) {
      logInfo('Reading not found', { reading_id });
      return createErrorResponse('Reading not found', 404);
    }

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

    logInfo('Reading detail completed', { reading_id });
    return createSuccessResponse(response);
  } catch (error) {
    logError('Failed to get reading detail', error);
    return createErrorResponse('Failed to get reading detail', 500);
  }
} 