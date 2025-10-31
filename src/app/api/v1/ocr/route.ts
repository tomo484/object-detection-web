import { createSuccessResponse, createErrorResponse, logInfo, logError, generateId } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { MlApiClient } from '@/lib/ml-client';
import { BlobClient } from '@/lib/blob-client';
import type { OcrRequest, OcrResult } from '@/lib/dto';

export async function POST(request: Request) {
  try {
    const body: OcrRequest = await request.json();
    const { imageBase64, uuid } = body;

    if (!imageBase64 || !uuid) {
      return createErrorResponse('Missing required fields: imageBase64, uuid', 400);
    }

    logInfo('OCR request received', { uuid, imageLength: imageBase64.length });

    const readingId = generateId();

    const blobClient = new BlobClient();
    const imageUrl = await blobClient.uploadImage(imageBase64, `${readingId}.jpg`);

    const mlClient = new MlApiClient();
    const mlResult = await mlClient.processImage(imageBase64);

    const textNormalized = mlResult.result.text_normalized;
    const processingTime = mlResult.processing_time;
    const preprocessingAttempts = mlResult.result.preprocessing_attempts;
    const totalLinesDetected = mlResult.metadata.total_lines_detected;
    const numericCandidates = mlResult.metadata.numeric_candidates;
    
    const confidence = Math.max(0.1, Math.min(0.99, 1 - (processingTime / 100)));

    const reading = await prisma.reading.create({
      data: {
        readingId,
        uuid,
        imageUrl,
        type: 'digital',
        value: textNormalized,
        confidence,
        processingTime,
        preprocessingAttempts,
        totalLinesDetected,
        numericCandidates,
      },
    });

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

    logInfo('OCR completed', { 
      readingId, 
      value: textNormalized, 
      processingTime,
      preprocessingAttempts 
    });
    return createSuccessResponse(response);
  } catch (error) {
    logError('OCR processing failed', error);
    
    const status = error instanceof Error && error.message.includes('ML_API') ? 503 : 500;
    return createErrorResponse('OCR processing failed', status);
  }
} 