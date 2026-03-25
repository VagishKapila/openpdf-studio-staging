import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../config/env';
import { v4 as uuidv4 } from 'uuid';

const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
  } : undefined,
});

const BUCKET = env.AWS_S3_BUCKET;

// Generate a unique S3 key for a file
export function generateS3Key(userId: string, folder: string, fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'pdf';
  const uniqueId = uuidv4();
  return `${folder}/${userId}/${uniqueId}.${ext}`;
}

// Upload a file buffer to S3
export async function uploadToS3(key: string, body: Buffer | Uint8Array, contentType: string): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  return key;
}

// Get a pre-signed download URL (expires in 1 hour by default)
export async function getDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}

// Get a pre-signed upload URL (for client-side direct upload)
export async function getUploadUrl(key: string, contentType: string, expiresIn = 600): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

// Delete a file from S3
export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

// Get file as buffer from S3
export async function getFromS3(key: string): Promise<Buffer> {
  const response = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const stream = response.Body as NodeJS.ReadableStream;
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Uint8Array);
  }
  return Buffer.concat(chunks);
}
