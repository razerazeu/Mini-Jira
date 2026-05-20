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

  subscribeEmail(topicArn: string | undefined, email: string) {
    if (!topicArn) {
      throw new Error('SNS topic ARN is not configured');
    }

    return this.client.send(
      new SubscribeCommand({
        TopicArn: topicArn,
        Protocol: 'email',
        Endpoint: email,
        ReturnSubscriptionArn: true,
      }),
    );
  }

  subscribeEmailToTaskAssignments(email: string) {
    return this.subscribeEmail(process.env.SNS_TASK_ASSIGNMENT_TOPIC_ARN, email);
  }

  subscribeEmailToDailyDigest(email: string) {
    return this.subscribeEmail(process.env.SNS_DAILY_DIGEST_TOPIC_ARN, email);
  }

  subscribeEmailToAlarms(email: string) {
    return this.subscribeEmail(process.env.SNS_ALARM_TOPIC_ARN, email);
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
