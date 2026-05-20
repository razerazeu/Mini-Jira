import {
  CloudWatchClient,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';

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

export const handler = async (event: SqsEvent) => {
  const records = event.Records || [];

  for (const record of records) {
    const assignmentEvent = parseAssignmentEvent(record.body);

    if (assignmentEvent.eventType !== 'TASK_ASSIGNED') {
      continue;
    }

    validateTaskAssignedEvent(assignmentEvent);
    await publishAssignmentMetric(assignmentEvent);
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
      ],
    }),
  );
}
