import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { dynamoDbTableConfig, DynamoDbTableName } from './aws.config';

@Injectable()
export class DynamoDBService {
  private readonly client: DynamoDBDocumentClient;
  readonly tables: Record<DynamoDbTableName, string>;

  constructor(private readonly configService: ConfigService) {
    const dynamoClient = new DynamoDBClient({
      region: this.configService.getOrThrow<string>('AWS_REGION'),
    });

    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tables = this.resolveTables();
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

  table(name: DynamoDbTableName) {
    return this.tables[name];
  }

  private resolveTables(): Record<DynamoDbTableName, string> {
    return Object.fromEntries(
      Object.entries(dynamoDbTableConfig).map(([name, config]) => [
        name,
        this.configService.get<string>(config.envKey),
      ]),
    ) as Record<DynamoDbTableName, string>;
  }
}
