import { Injectable } from '@nestjs/common';
import {
  SNSClient,
  ListSubscriptionsByTopicCommand,
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
    return this.subscribeEmail(
      process.env.SNS_TASK_ASSIGNMENT_TOPIC_ARN,
      email,
    );
  }

  subscribeEmailToDailyDigest(email: string) {
    return this.subscribeEmail(process.env.SNS_DAILY_DIGEST_TOPIC_ARN, email);
  }

  subscribeEmailToAlarms(email: string) {
    return this.subscribeEmail(process.env.SNS_ALARM_TOPIC_ARN, email);
  }

  setEmailFilterPolicy(subscriptionArn: string, email: string) {
    const filterEmails = this.getEmailFilterValues(email);

    return Promise.all([
      this.client.send(
        new SetSubscriptionAttributesCommand({
          SubscriptionArn: subscriptionArn,
          AttributeName: 'FilterPolicyScope',
          AttributeValue: 'MessageAttributes',
        }),
      ),
      this.client.send(
        new SetSubscriptionAttributesCommand({
          SubscriptionArn: subscriptionArn,
          AttributeName: 'FilterPolicy',
          AttributeValue: JSON.stringify({
            assigneeEmail: filterEmails,
          }),
        }),
      ),
    ]);
  }

  async setEmailEndpointFilterPolicies(topicArn: string) {
    let nextToken: string | undefined;
    let updatedCount = 0;

    do {
      const result = await this.client.send(
        new ListSubscriptionsByTopicCommand({
          TopicArn: topicArn,
          NextToken: nextToken,
        }),
      );

      for (const subscription of result.Subscriptions || []) {
        const endpoint = subscription.Endpoint?.trim();
        const subscriptionArn = subscription.SubscriptionArn;

        if (
          subscription.Protocol !== 'email' ||
          !endpoint ||
          !subscriptionArn ||
          subscriptionArn === 'PendingConfirmation' ||
          subscriptionArn === 'pending confirmation'
        ) {
          continue;
        }

        await this.setEmailFilterPolicy(subscriptionArn, endpoint);
        updatedCount += 1;
      }

      nextToken = result.NextToken;
    } while (nextToken);

    return { updatedCount };
  }

  private getEmailFilterValues(email: string) {
    return [...new Set([email.trim(), email.trim().toLowerCase()])].filter(
      Boolean,
    );
  }
}
