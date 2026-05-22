import {
  CloudWatchClient,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';

type SqsRecord = {
  messageId: string;
  body: string;
};

type SqsEvent = {
  Records?: SqsRecord[];
};

type TaskAssignedEvent = {
  eventId: string;
  eventType: string;
  occurredAt?: string;
  task?: {
    id?: string;
    taskId?: string;
    title?: string;
    projectId?: string;
    teamId?: string;
    priority?: string;
    deadline?: string;
  };
  assignee?: {
    userId?: string;
    name?: string | null;
    email?: string | null;
  };
  actor?: {
    userId?: string;
    name?: string;
    email?: string;
  };
};

const region = process.env.AWS_REGION;
const cloudWatch = new CloudWatchClient({ region });
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region }), {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export const handler = async (event: SqsEvent) => {
  const records = event.Records || [];

  console.log('Assignment worker invoked', {
    recordCount: records.length,
  });

  for (const record of records) {
    console.log('Processing SQS record', {
      messageId: record.messageId,
    });

    const assignmentEvent = parseAssignmentEvent(record.body);

    if (assignmentEvent.eventType !== 'TASK_ASSIGNED') {
      console.log('Skipping non-assignment event', {
        messageId: record.messageId,
        eventType: assignmentEvent.eventType,
      });
      continue;
    }

    validateTaskAssignedEvent(assignmentEvent);
    await writeActivityLog(assignmentEvent);
    await publishAssignmentMetric(assignmentEvent);

    console.log('Processed TASK_ASSIGNED event', {
      messageId: record.messageId,
      eventId: assignmentEvent.eventId,
      taskId: assignmentEvent.task?.taskId || assignmentEvent.task?.id,
      teamId: assignmentEvent.task?.teamId,
    });
  }
};

function parseAssignmentEvent(body: string): TaskAssignedEvent {
  const parsedBody = JSON.parse(body);

  if (parsedBody.Type === 'Notification' && parsedBody.Message) {
    return parseAssignmentPayload(parsedBody.Message);
  }

  return parseAssignmentPayload(parsedBody);
}

function parseAssignmentPayload(payload: unknown): TaskAssignedEvent {
  const parsedPayload =
    typeof payload === 'string' ? JSON.parse(payload) : payload;

  if (
    parsedPayload &&
    typeof parsedPayload === 'object' &&
    'default' in parsedPayload
  ) {
    const defaultPayload = (parsedPayload as { default: unknown }).default;
    return parseAssignmentPayload(defaultPayload);
  }

  return parsedPayload as TaskAssignedEvent;
}

function validateTaskAssignedEvent(event: TaskAssignedEvent) {
  if (!event.eventId) {
    throw new Error('TASK_ASSIGNED event is missing eventId');
  }

  if (!event.task?.teamId) {
    throw new Error('TASK_ASSIGNED event is missing task.teamId');
  }
}

async function publishAssignmentMetric(event: TaskAssignedEvent) {
  const task = event.task || {};

  const dimensions = [
    {
      Name: 'TeamId',
      Value: String(task.teamId),
    },
  ];

  await cloudWatch.send(
    new PutMetricDataCommand({
      Namespace: process.env.CLOUDWATCH_NAMESPACE || 'MiniJira',
      MetricData: [
        {
          MetricName: 'TasksAssignedPerTeam',
          Value: 1,
          Unit: 'Count',
          Dimensions: dimensions,
        },
        {
          MetricName: 'TasksAssigned',
          Value: 1,
          Unit: 'Count',
        },
      ],
    }),
  );

  console.log('Published assignment metric', {
    namespace: process.env.CLOUDWATCH_NAMESPACE || 'MiniJira',
    metricNames: ['TasksAssignedPerTeam', 'TasksAssigned'],
    teamId: task.teamId,
  });
}

async function writeActivityLog(event: TaskAssignedEvent) {
  const tableName = process.env.DYNAMODB_ACTIVITY_LOG_TABLE;

  if (!tableName) {
    throw new Error('DYNAMODB_ACTIVITY_LOG_TABLE is not configured');
  }

  const task = event.task || {};
  const assignee = event.assignee || {};
  const actor = event.actor || {};
  const taskId = task.taskId || task.id;
  const actorName = actor.name || actor.email || actor.userId || 'system';
  const taskLabel = task.title || taskId || 'task';

  await dynamo.send(
    new PutCommand({
      TableName: tableName,
      Item: removeUndefined({
        activityId: event.eventId,
        type: 'TASK_ASSIGNED',
        taskId,
        projectId: task.projectId,
        teamId: task.teamId,
        assigneeId: assignee.userId,
        assigneeEmail: assignee.email,
        actorId: actor.userId,
        actorName,
        message: `${actorName} assigned task ${taskLabel}`,
        metadata: {
          source: 'assignment-worker',
          event,
        },
        createdAt: event.occurredAt || new Date().toISOString(),
      }),
    }),
  );

  console.log('Wrote assignment activity log', {
    tableName,
    activityId: event.eventId,
    taskId,
    teamId: task.teamId,
  });
}

function removeUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  ) as T;
}
