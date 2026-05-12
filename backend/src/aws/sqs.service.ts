import { Injectable } from '@nestjs/common';
import {
  SQSClient,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';

@Injectable()
export class SQSService {
  private readonly client: SQSClient;

  constructor() {
    this.client = new SQSClient({
      region: process.env.AWS_REGION,
    });
  }

  sendMessage(params: ConstructorParameters<typeof SendMessageCommand>[0]) {
    return this.client.send(new SendMessageCommand(params));
  }
}