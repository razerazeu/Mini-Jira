import { Injectable } from '@nestjs/common';
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';

@Injectable()
export class CloudWatchService {
  private readonly client: CloudWatchClient;

  constructor() {
    this.client = new CloudWatchClient({
      region: process.env.AWS_REGION,
    });
  }

  putMetricData(params: ConstructorParameters<typeof PutMetricDataCommand>[0]) {
    return this.client.send(new PutMetricDataCommand(params));
  }

  recordTaskCreated(teamId: string) {
    return this.putMetricData({
      Namespace: process.env.CLOUDWATCH_NAMESPACE || 'MiniJira',
      MetricData: [
        {
          MetricName: 'TasksCreated',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            {
              Name: 'TeamId',
              Value: teamId,
            },
          ],
        },
      ],
    });
  }

  recordTaskClosed(teamId: string) {
    return this.putMetricData({
      Namespace: process.env.CLOUDWATCH_NAMESPACE || 'MiniJira',
      MetricData: [
        {
          MetricName: 'TasksClosed',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            {
              Name: 'TeamId',
              Value: teamId,
            },
          ],
        },
      ],
    });
  }
}