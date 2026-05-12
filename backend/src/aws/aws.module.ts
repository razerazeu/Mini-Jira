import { Module } from '@nestjs/common';
import { DynamoDBService } from './dynamodb.service';
import { S3Service } from './s3.service';
import { SNSService } from './sns.service';
import { SQSService } from './sqs.service';
import { CloudWatchService } from './cloudwatch.service';

@Module({
  providers: [
    DynamoDBService,
    S3Service,
    SNSService,
    SQSService,
    CloudWatchService,
  ],
  exports: [
    DynamoDBService,
    S3Service,
    SNSService,
    SQSService,
    CloudWatchService,
  ],
})
export class AwsModule {}