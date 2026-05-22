import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  ListSubscriptionsByTopicCommand,
  PublishCommand,
  SNSClient,
  SetSubscriptionAttributesCommand,
} from '@aws-sdk/client-sns';

type EventBridgeScheduledEvent = {
  id?: string;
  time?: string;
  resources?: string[];
};

type Task = {
  taskId?: string;
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  deadline?: string;
  assigneeId?: string;
  assigneeName?: string | null;
  assigneeEmail?: string | null;
  projectId?: string;
  teamId?: string;
  isDeleted?: boolean;
};

type DigestRecipient = {
  assigneeEmail: string;
  assigneeName?: string | null;
  tasks: Task[];
};

const region = process.env.AWS_REGION;
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
const sns = new SNSClient({ region });

const tasksTable = process.env.DYNAMODB_TASKS_TABLE;
const digestTopicArn = process.env.SNS_DAILY_DIGEST_TOPIC_ARN;
const dailyDigestRuleArn = process.env.DAILY_DIGEST_RULE_ARN;

export const handler = async (event: EventBridgeScheduledEvent) => {
  validateEnvironment();

  console.log('Daily digest Lambda invoked', {
    eventId: event.id,
    eventTime: event.time,
    tasksTableConfigured: Boolean(tasksTable),
    topicConfigured: Boolean(digestTopicArn),
    ruleArnConfigured: Boolean(dailyDigestRuleArn),
  });

  if (dailyDigestRuleArn && event.resources?.length) {
    const matchedConfiguredRule = event.resources.includes(dailyDigestRuleArn);
    console.log('Daily digest rule source checked', {
      matchedConfiguredRule,
      resources: event.resources,
    });
  }

  const dueDate = getDueDate(event.time);
  const dueTasks = await scanTasksDueOn(dueDate);
  const recipients = groupTasksByAssignee(dueTasks);

  console.log('Daily digest tasks grouped', {
    dueDate,
    taskCount: dueTasks.length,
    recipientCount: recipients.length,
  });

  if (recipients.length > 0) {
    await ensureTopicEmailFilters(digestTopicArn);
  }

  for (const recipient of recipients) {
    await publishDigest(recipient, dueDate);
  }

  return {
    dueDate,
    taskCount: dueTasks.length,
    recipientCount: recipients.length,
  };
};

function validateEnvironment() {
  const missing = [
    ['DYNAMODB_TASKS_TABLE', tasksTable],
    ['SNS_DAILY_DIGEST_TOPIC_ARN', digestTopicArn],
    ['DAILY_DIGEST_RULE_ARN', dailyDigestRuleArn],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

async function scanTasksDueOn(dueDate: string) {
  const tasks: Task[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const response = await dynamo.send(
      new ScanCommand({
        TableName: tasksTable,
        FilterExpression:
          'begins_with(#deadline, :dueDate) AND (attribute_not_exists(#isDeleted) OR #isDeleted = :false) AND #status <> :done',
        ExpressionAttributeNames: {
          '#deadline': 'deadline',
          '#isDeleted': 'isDeleted',
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':dueDate': dueDate,
          ':false': false,
          ':done': 'DONE',
        },
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );

    tasks.push(...((response.Items || []) as Task[]));
    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return tasks.filter((task) => Boolean(task.assigneeEmail));
}

function groupTasksByAssignee(tasks: Task[]) {
  const recipients = new Map<string, DigestRecipient>();

  for (const task of tasks) {
    const assigneeEmail = task.assigneeEmail?.trim().toLowerCase();
    if (!assigneeEmail) {
      console.warn('Skipping due task without assigneeEmail', {
        taskId: task.taskId || task.id,
      });
      continue;
    }

    const recipient = recipients.get(assigneeEmail) || {
      assigneeEmail,
      assigneeName: task.assigneeName,
      tasks: [],
    };

    recipient.tasks.push(task);
    recipients.set(assigneeEmail, recipient);
  }

  return [...recipients.values()];
}

async function publishDigest(recipient: DigestRecipient, dueDate: string) {
  const subject = `Mini Jira daily digest: ${recipient.tasks.length} task${recipient.tasks.length === 1 ? '' : 's'} due today`;
  const message = buildDigestEmail(recipient, dueDate);

  await sns.send(
    new PublishCommand({
      TopicArn: digestTopicArn,
      Subject: subject.slice(0, 100),
      Message: message,
      MessageAttributes: {
        assigneeEmail: {
          DataType: 'String',
          StringValue: recipient.assigneeEmail,
        },
      },
    }),
  );

  console.log('Published daily digest', {
    assigneeEmail: recipient.assigneeEmail,
    taskCount: recipient.tasks.length,
    dueDate,
  });
}

async function ensureTopicEmailFilters(topicArn: string | undefined) {
  if (!topicArn) {
    throw new Error('SNS_DAILY_DIGEST_TOPIC_ARN is not configured');
  }

  let nextToken: string | undefined;
  let updatedCount = 0;

  do {
    const result = await sns.send(
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

      await Promise.all([
        sns.send(
          new SetSubscriptionAttributesCommand({
            SubscriptionArn: subscriptionArn,
            AttributeName: 'FilterPolicyScope',
            AttributeValue: 'MessageAttributes',
          }),
        ),
        sns.send(
          new SetSubscriptionAttributesCommand({
            SubscriptionArn: subscriptionArn,
            AttributeName: 'FilterPolicy',
            AttributeValue: JSON.stringify({
              assigneeEmail: getEmailFilterValues(endpoint),
            }),
          }),
        ),
      ]);
      updatedCount += 1;
    }

    nextToken = result.NextToken;
  } while (nextToken);

  console.log('Ensured daily digest SNS email filters', {
    topicArn,
    updatedCount,
  });
}

function getEmailFilterValues(email: string) {
  return [...new Set([email.trim(), email.trim().toLowerCase()])].filter(
    Boolean,
  );
}

function buildDigestEmail(recipient: DigestRecipient, dueDate: string) {
  const assigneeName = recipient.assigneeName || 'there';
  const taskLines = recipient.tasks
    .sort(compareTasks)
    .map((task, index) => {
      const title = task.title || task.taskId || task.id || 'Untitled task';
      const priority = task.priority || 'Unspecified';
      const status = task.status || 'Unspecified';
      const deadline = task.deadline || dueDate;

      return [
        `${index + 1}. ${title}`,
        `   Priority: ${priority}`,
        `   Status: ${status}`,
        `   Deadline: ${deadline}`,
      ].join('\n');
    });

  return [
    `Hi ${assigneeName},`,
    '',
    `Here are your Mini Jira tasks due today (${dueDate}):`,
    '',
    ...taskLines,
    '',
    'Please sign in to Mini Jira to review them.',
  ].join('\n');
}

function compareTasks(left: Task, right: Task) {
  return (
    priorityRank(right.priority) - priorityRank(left.priority) ||
    String(left.deadline || '').localeCompare(String(right.deadline || '')) ||
    String(left.title || '').localeCompare(String(right.title || ''))
  );
}

function priorityRank(priority: string | undefined) {
  if (priority === 'HIGH') {
    return 3;
  }

  if (priority === 'MEDIUM') {
    return 2;
  }

  if (priority === 'LOW') {
    return 1;
  }

  return 0;
}

function getDueDate(eventTime: string | undefined) {
  const date = eventTime ? new Date(eventTime) : new Date();

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid EventBridge time: ${eventTime}`);
  }

  return date.toISOString().slice(0, 10);
}
