import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

@Injectable()
export class DynamoDBService {
  private readonly client: DynamoDBDocumentClient;

  constructor() {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION,
    });

    this.client = DynamoDBDocumentClient.from(dynamoClient);
  }

  put(params: ConstructorParameters<typeof PutCommand>[0]) {
    return this.client.send(new PutCommand(params));
  }

  get(params: ConstructorParameters<typeof GetCommand>[0]) {
    return this.client.send(new GetCommand(params));
  }

  update(params: ConstructorParameters<typeof UpdateCommand>[0]) {
    return this.client.send(new UpdateCommand(params));
  }

  delete(params: ConstructorParameters<typeof DeleteCommand>[0]) {
    return this.client.send(new DeleteCommand(params));
  }

  query(params: ConstructorParameters<typeof QueryCommand>[0]) {
    return this.client.send(new QueryCommand(params));
  }

  scan(params: ConstructorParameters<typeof ScanCommand>[0]) {
    return this.client.send(new ScanCommand(params));
  }
}