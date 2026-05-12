import { Injectable } from '@nestjs/common';
import {
  SNSClient,
  PublishCommand,
  SubscribeCommand,
  SetSubscriptionAttributesCommand,
} from '@aws-sdk/client-sns';

@Injectable()
export class SNSService {
  private readonly client: SNSClient;

  constructor() {
    this.client = new SNSClient({
      region: process.env.AWS_REGION,
    });
  }

  publish(params: ConstructorParameters<typeof PublishCommand>[0]) {
    return this.client.send(new PublishCommand(params));
  }

  subscribeEmailToTaskAssignments(email: string) {
    return this.client.send(
      new SubscribeCommand({
        TopicArn: process.env.SNS_TASK_ASSIGNMENT_TOPIC_ARN,
        Protocol: 'email',
        Endpoint: email,
        ReturnSubscriptionArn: true,
      }),
    );
  }

  setEmailFilterPolicy(subscriptionArn: string, email: string) {
    return this.client.send(
      new SetSubscriptionAttributesCommand({
        SubscriptionArn: subscriptionArn,
        AttributeName: 'FilterPolicy',
        AttributeValue: JSON.stringify({
          assigneeEmail: [email],
        }),
      }),
    );
  }
}