import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DynamoDBService } from '../aws/dynamodb.service';
import { ActivityLog } from './activitylog';

@Injectable()
export class ActivityLogService {
  private readonly tableName?: string;
  private readonly taskIdIndexName?: string;
  private readonly useDynamo: boolean;

  constructor(private readonly dynamo: DynamoDBService) {
    this.tableName = this.dynamo.table('activityLog');
    this.taskIdIndexName = process.env.ACTIVITY_LOG_TASK_INDEX;
    this.useDynamo = process.env.USE_DYNAMODB !== 'false' && !!this.tableName;
  }

  async write(
    entry: Omit<ActivityLog, 'activityId' | 'createdAt'> & {
      activityId?: string;
      logId?: string;
      createdAt?: string;
    },
  ) {
    const { activityId, logId, createdAt, ...rest } = entry;
    const log: ActivityLog = {
      ...rest,
      activityId: activityId ?? logId ?? randomUUID(),
      createdAt: createdAt ?? new Date().toISOString(),
    };

    if (!this.useDynamo) {
      return log;
    }

    try {
      await this.dynamo.put({
        TableName: this.tableName,
        Item: this.removeUndefined({ ...log }),
      });
    } catch (error) {
      console.error('Failed to write activity log', {
        error,
        activityId: log.activityId,
        type: log.type,
      });
    }

    return log;
  }

  private removeUndefined<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(
      Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
    ) as T;
  }

  async findByTask(taskId: string) {
    if (!this.useDynamo) {
      return [] as ActivityLog[];
    }

    if (this.taskIdIndexName) {
      const result = await this.dynamo.query({
        TableName: this.tableName,
        IndexName: this.taskIdIndexName,
        KeyConditionExpression: 'taskId = :taskId',
        ExpressionAttributeValues: {
          ':taskId': taskId,
        },
      });
      return (result.Items || []) as ActivityLog[];
    }

    const result = await this.dynamo.scan({
      TableName: this.tableName,
      FilterExpression: 'taskId = :taskId',
      ExpressionAttributeValues: {
        ':taskId': taskId,
      },
    });
    return (result.Items || []) as ActivityLog[];
  }
}
