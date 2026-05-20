import { Readable } from 'stream';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import Jimp from 'jimp';

type S3Event = {
  Records?: Array<{
    s3?: {
      bucket?: {
        name?: string;
      };
      object?: {
        key?: string;
      };
    };
  }>;
};

const region = process.env.AWS_REGION;
const s3 = new S3Client({ region });
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

const resizedBucket = process.env.S3_RESIZED_BUCKET;
const tasksTable = process.env.DYNAMODB_TASKS_TABLE;
const resizeWidth = readPositiveInteger(process.env.IMAGE_RESIZE_WIDTH, 240);
const resizeHeight = readPositiveInteger(process.env.IMAGE_RESIZE_HEIGHT, 240);

export const handler = async (event: S3Event) => {
  console.log('Image resize Lambda invoked', {
    records: event.Records?.length || 0,
    resizedBucketConfigured: Boolean(resizedBucket),
    tasksTableConfigured: Boolean(tasksTable),
    resizeWidth,
    resizeHeight,
  });

  if (!resizedBucket) {
    throw new Error('S3_RESIZED_BUCKET is required');
  }

  const records = event.Records || [];

  for (const record of records) {
    try {
      await processRecord(record);
    } catch (error) {
      console.error('Failed to resize S3 image record', {
        bucket: record.s3?.bucket?.name,
        key: record.s3?.object?.key,
        error,
      });
      throw error;
    }
  }
};

async function processRecord(record: NonNullable<S3Event['Records']>[number]) {
  if (!resizedBucket) {
    throw new Error('S3_RESIZED_BUCKET is required');
  }

  const bucket = record.s3?.bucket?.name;
  const encodedKey = record.s3?.object?.key;

  if (!bucket || !encodedKey) {
    console.warn('Skipping S3 event record without bucket or key', { record });
    return;
  }

  const originalKey = decodeS3Key(encodedKey);
  const taskId = parseTaskId(originalKey);

  console.log('Processing original task image', {
    taskId,
    originalBucket: bucket,
    originalKey,
  });

  if (!taskId) {
    console.warn('Skipping object key that does not match tasks/{taskId}/...', {
      bucket,
      key: originalKey,
    });
    return;
  }

  const originalImage = await readS3Object(bucket, originalKey);
  console.log('Read original task image from S3', {
    taskId,
    bytes: originalImage.length,
  });

  const { body: resizedImage, contentType, extension } =
    await resizeImage(originalImage);
  const resizedKey = buildResizedKey(originalKey, extension);

  console.log('Writing resized task image to S3', {
    taskId,
    resizedBucket,
    resizedKey,
    bytes: resizedImage.length,
    contentType,
  });

  await s3.send(
    new PutObjectCommand({
      Bucket: resizedBucket,
      Key: resizedKey,
      Body: resizedImage,
      ContentType: contentType,
    }),
  );

  console.log('Wrote resized task image to S3', {
    taskId,
    resizedBucket,
    resizedKey,
  });

  await updateTaskImage(taskId, bucket, originalKey, resizedBucket, resizedKey);

  console.log('Resized task image', {
      taskId,
      originalBucket: bucket,
      originalKey,
      resizedBucket,
      resizedKey,
  });
}

async function readS3Object(bucket: string, key: string) {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  if (!response.Body) {
    throw new Error(`S3 object has no body: s3://${bucket}/${key}`);
  }

  return streamToBuffer(response.Body as Readable);
}

async function resizeImage(image: Buffer) {
  const sourceImage = await Jimp.read(image);
  const metadata = {
    width: sourceImage.bitmap.width,
    height: sourceImage.bitmap.height,
    mime: sourceImage.getMIME(),
  };
  const format = formatFromMime(metadata.mime);
  const contentType = contentTypeFromFormat(format);
  const extension = extensionFromFormat(format);

  resizeInside(sourceImage, resizeWidth, resizeHeight);

  const body = await sourceImage.getBufferAsync(contentType);

  console.log('Resized image with Jimp', {
    originalWidth: metadata.width,
    originalHeight: metadata.height,
    resizedWidth: sourceImage.bitmap.width,
    resizedHeight: sourceImage.bitmap.height,
    format,
    resizedBytes: body.length,
  });

  return {
    body,
    contentType,
    extension,
  };
}

function resizeInside(image: Jimp, maxWidth: number, maxHeight?: number) {
  const widthRatio = maxWidth / image.bitmap.width;
  const heightRatio = maxHeight ? maxHeight / image.bitmap.height : widthRatio;
  const scale = Math.min(widthRatio, heightRatio, 1);

  if (scale >= 1) {
    return;
  }

  image.resize(
    Math.max(1, Math.round(image.bitmap.width * scale)),
    Math.max(1, Math.round(image.bitmap.height * scale)),
  );
}

async function updateTaskImage(
  taskId: string,
  originalBucket: string,
  originalKey: string,
  resizedBucketName: string,
  resizedKey: string,
) {
  if (!tasksTable) {
    return;
  }

  try {
    await dynamo.send(
      new UpdateCommand({
        TableName: tasksTable,
        Key: { taskId },
        UpdateExpression:
          'SET image.resizedBucket = :resizedBucket, image.resizedKey = :resizedKey, imageResizedKey = :resizedKey, updatedAt = :updatedAt',
        ConditionExpression:
          'attribute_exists(taskId) AND image.originalBucket = :originalBucket AND image.originalKey = :originalKey AND image.isActive = :active',
        ExpressionAttributeValues: {
          ':resizedBucket': resizedBucketName,
          ':resizedKey': resizedKey,
          ':updatedAt': new Date().toISOString(),
          ':originalBucket': originalBucket,
          ':originalKey': originalKey,
          ':active': true,
        },
      }),
    );
  } catch (error) {
    if (isConditionalCheckFailure(error)) {
      console.warn('Skipped Task image update because the image is no longer active', {
        taskId,
        originalBucket,
        originalKey,
      });
      return;
    }

    throw error;
  }
}

function decodeS3Key(key: string) {
  return decodeURIComponent(key.replace(/\+/g, ' '));
}

function parseTaskId(key: string) {
  const parts = key.split('/');
  return parts.length >= 3 && parts[0] === 'tasks' ? parts[1] : null;
}

function buildResizedKey(originalKey: string, extension: string) {
  const parts = originalKey.split('/');

  if (
    parts.length >= 4 &&
    parts[0] === 'tasks' &&
    parts[2] === 'image' &&
    parts[3] === 'original'
  ) {
    return `tasks/${parts[1]}/image/resized.${extension}`;
  }

  const lastSlash = originalKey.lastIndexOf('/');
  const directory = lastSlash >= 0 ? originalKey.slice(0, lastSlash + 1) : '';
  const fileName = lastSlash >= 0 ? originalKey.slice(lastSlash + 1) : originalKey;
  const hasExtension = /\.[^/.]+$/.test(fileName);

  return `${directory}resized_${fileName}${hasExtension ? '' : `.${extension}`}`;
}

function contentTypeFromFormat(format: string) {
  if (format === 'jpg' || format === 'jpeg') {
    return 'image/jpeg';
  }

  if (format === 'png') {
    return 'image/png';
  }

  if (format === 'webp') {
    return 'image/webp';
  }

  if (format === 'gif') {
    return 'image/gif';
  }

  return 'image/jpeg';
}

function formatFromMime(mime: string) {
  if (mime === Jimp.MIME_PNG) {
    return 'png';
  }

  if (mime === Jimp.MIME_BMP) {
    return 'bmp';
  }

  if (mime === Jimp.MIME_TIFF) {
    return 'tiff';
  }

  return 'jpeg';
}

function extensionFromFormat(format: string) {
  if (format === 'jpg' || format === 'jpeg') {
    return 'jpg';
  }

  if (format === 'png' || format === 'webp' || format === 'gif') {
    return format;
  }

  return 'jpg';
}

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function readOptionalPositiveInteger(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function isConditionalCheckFailure(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'ConditionalCheckFailedException'
  );
}

function streamToBuffer(stream: Readable) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    stream.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}
