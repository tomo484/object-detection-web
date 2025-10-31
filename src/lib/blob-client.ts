import { BlobServiceClient } from '@azure/storage-blob';
import { logError, logInfo } from './api-utils';

export class BlobClient {
  private readonly connectionString: string;
  private readonly containerName: string;

  constructor() {
    this.connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
    this.containerName = process.env.AZURE_STORAGE_CONTAINER || 'images';
  }

  async uploadImage(imageBase64: string, fileName: string): Promise<string> {
    if (!this.connectionString) {
      logError('Azure Storage not configured, using fallback URL');
      return `https://example.com/images/${fileName}`;
    }

    try {
      const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      
      logInfo('Image upload to Azure Blob Storage', { fileName, size: buffer.length });

      const blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString);
      const containerClient = blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      await blockBlobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: {
          blobContentType: 'image/jpeg'
        }
      });

      const imageUrl = blockBlobClient.url;
      logInfo('Image uploaded successfully', { imageUrl });
      return imageUrl;
    } catch (error) {
      logError('Failed to upload image to Azure Blob Storage', error);
      return `https://example.com/images/${fileName}`;
    }
  }
} 