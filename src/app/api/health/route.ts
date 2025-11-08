import { createSuccessResponse, createErrorResponse, logInfo, logError } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    logInfo('Health check requested');
    
    // データベースに接続できるかどうかを確認する
    await prisma.$queryRaw`SELECT 1`;
    
    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    };

    logInfo('Health check completed', response);
    return createSuccessResponse(response);
  } catch (error) {
    logError('Health check failed', error);
    return createErrorResponse('Service unavailable', 503);
  }
} 