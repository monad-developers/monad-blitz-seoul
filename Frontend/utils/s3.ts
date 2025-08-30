import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { S3_CONFIG } from '../config/web3';

const s3Client = new S3Client({
  region: S3_CONFIG.region,
  credentials: {
    accessKeyId: S3_CONFIG.accessKeyId,
    secretAccessKey: S3_CONFIG.secretAccessKey,
  },
});

export const uploadToS3 = async (file: File, prefix = 'music/'): Promise<string> => {
  try {
    const fileName = `${prefix}${Date.now()}-${file.name}`;
    
    await s3Client.send(new PutObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: fileName,
      Body: file,
      ContentType: file.type,
    }));

    // Return the S3 URL
    return `https://${S3_CONFIG.bucket}.s3.${S3_CONFIG.region}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload file to S3');
  }
};

export const getFileFromS3Url = async (url: string): Promise<Blob> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch file from S3');
    }
    return await response.blob();
  } catch (error) {
    console.error('Error fetching from S3:', error);
    throw new Error('Failed to fetch file from S3');
  }
};