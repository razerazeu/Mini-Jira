import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION,
    });
  }

  uploadObject(params: ConstructorParameters<typeof PutObjectCommand>[0]) {
    return this.client.send(new PutObjectCommand(params));
  }

  getObject(params: ConstructorParameters<typeof GetObjectCommand>[0]) {
    return this.client.send(new GetObjectCommand(params));
  }

  deleteObject(params: ConstructorParameters<typeof DeleteObjectCommand>[0]) {
    return this.client.send(new DeleteObjectCommand(params));
  }

  getPresignedGetUrl(bucket: string, key: string, expiresIn = 3600) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
      { expiresIn },
    );
  }
}