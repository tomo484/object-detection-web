import { logError, logInfo } from './api-utils';
import type { MlApiResponse, MlApiRequest } from './dto';

export class MlApiClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor() {
    this.baseUrl = process.env.ML_API_URL || '';
    this.timeout = parseInt(process.env.ML_API_TIMEOUT || '30000');
    this.maxRetries = 3;
  }

  async processImage(imageBase64: string): Promise<MlApiResponse> {
    if (!this.baseUrl) {
      throw new Error('ML_API_URL not configured');
    }

    const request: MlApiRequest = {
      image_base64: imageBase64,
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logInfo(`ML API request attempt ${attempt}`, { url: this.baseUrl });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`ML API responded with status: ${response.status}`);
        }

        const result: MlApiResponse = await response.json();
        
        logInfo('ML API request successful', { 
          attempt, 
          text_normalized: result.result.text_normalized,
          processing_time: result.processing_time,
          preprocessing_attempts: result.result.preprocessing_attempts
        });

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logError(`ML API request failed (attempt ${attempt})`, lastError);

        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError || new Error('ML API request failed');
  }
} 