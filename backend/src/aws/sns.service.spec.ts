import { SNSService } from './sns.service';

describe('SNSService', () => {
  it('filters email subscriptions by assigneeEmail', async () => {
    const service = new SNSService();
    const send = jest.fn().mockResolvedValue({});
    (service as any).client = { send };

    await service.setEmailFilterPolicy('subscription-arn', 'User@Example.com');

    const scopeCommand = send.mock.calls[0][0] as any;
    const filterCommand = send.mock.calls[1][0] as any;

    expect(scopeCommand.input.SubscriptionArn).toBe('subscription-arn');
    expect(scopeCommand.input.AttributeName).toBe('FilterPolicyScope');
    expect(scopeCommand.input.AttributeValue).toBe('MessageAttributes');
    expect(filterCommand.input.SubscriptionArn).toBe('subscription-arn');
    expect(filterCommand.input.AttributeName).toBe('FilterPolicy');
    expect(JSON.parse(filterCommand.input.AttributeValue)).toEqual({
      assigneeEmail: ['User@Example.com', 'user@example.com'],
    });
  });

  it('repairs confirmed email subscriptions from the SNS topic endpoints', async () => {
    const service = new SNSService();
    const send = jest
      .fn()
      .mockResolvedValueOnce({
        Subscriptions: [
          {
            Protocol: 'email',
            Endpoint: 'u1@example.com',
            SubscriptionArn: 'u1-subscription',
          },
          {
            Protocol: 'email',
            Endpoint: 'pending@example.com',
            SubscriptionArn: 'PendingConfirmation',
          },
          {
            Protocol: 'sqs',
            Endpoint: 'queue-arn',
            SubscriptionArn: 'queue-subscription',
          },
        ],
      })
      .mockResolvedValue({});
    (service as any).client = { send };

    const result = await service.setEmailEndpointFilterPolicies('topic-arn');

    expect(result).toEqual({ updatedCount: 1 });
    expect(send).toHaveBeenCalledTimes(3);

    const filterCommand = send.mock.calls[2][0] as any;

    expect(filterCommand.input.SubscriptionArn).toBe('u1-subscription');
    expect(JSON.parse(filterCommand.input.AttributeValue)).toEqual({
      assigneeEmail: ['u1@example.com'],
    });
  });
});
