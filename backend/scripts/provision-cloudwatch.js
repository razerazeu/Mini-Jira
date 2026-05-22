const {
  CloudWatchClient,
  PutDashboardCommand,
  PutMetricAlarmCommand,
} = require('@aws-sdk/client-cloudwatch');
const fs = require('fs');
const path = require('path');

loadEnvFiles(['.env', path.join('src', '.env')]);

const region = process.env.AWS_REGION;
const namespace = process.env.CLOUDWATCH_NAMESPACE || 'MiniJira';
const dashboardName = process.env.CLOUDWATCH_DASHBOARD_NAME || 'MiniJiraDashboard';
const alarmTopicArn = process.env.SNS_ALARM_TOPIC_ARN;
const assignmentThreshold = Number(
  process.env.TASK_ASSIGNMENTS_ALARM_THRESHOLD || 5,
);
const alarmName =
  process.env.TASK_ASSIGNMENTS_ALARM_NAME || 'MiniJira-HighTaskAssignments';

if (!region) {
  throw new Error('AWS_REGION is required');
}

if (!alarmTopicArn) {
  throw new Error('SNS_ALARM_TOPIC_ARN is required');
}

if (!Number.isFinite(assignmentThreshold) || assignmentThreshold < 0) {
  throw new Error('TASK_ASSIGNMENTS_ALARM_THRESHOLD must be a non-negative number');
}

const cloudWatch = new CloudWatchClient({ region });

async function main() {
  await cloudWatch.send(
    new PutDashboardCommand({
      DashboardName: dashboardName,
      DashboardBody: JSON.stringify(buildDashboard()),
    }),
  );

  await cloudWatch.send(
    new PutMetricAlarmCommand({
      AlarmName: alarmName,
      AlarmDescription:
        'Mini Jira task assignment volume exceeded the configured threshold.',
      Namespace: namespace,
      MetricName: 'TasksAssigned',
      Statistic: 'Sum',
      Period: 300,
      EvaluationPeriods: 1,
      DatapointsToAlarm: 1,
      Threshold: assignmentThreshold,
      ComparisonOperator: 'GreaterThanThreshold',
      TreatMissingData: 'notBreaching',
      AlarmActions: [alarmTopicArn],
      OKActions: [alarmTopicArn],
    }),
  );

  console.log('Provisioned CloudWatch dashboard and alarm', {
    dashboardName,
    alarmName,
    namespace,
    assignmentThreshold,
    alarmTopicArn,
  });
}

function buildDashboard() {
  return {
    widgets: [
      metricWidget({
        title: 'Tasks Created Per Day',
        x: 0,
        y: 0,
        metrics: [
          [
            {
              expression: `SEARCH('{${namespace},TeamId} MetricName="TasksCreated"', 'Sum', 86400)`,
              id: 'created',
              label: 'Tasks created',
            },
          ],
        ],
        stat: 'Sum',
        period: 86400,
      }),
      metricWidget({
        title: 'Tasks Closed Per Day Per Team',
        x: 12,
        y: 0,
        metrics: [
          [
            {
              expression: `SEARCH('{${namespace},TeamId} MetricName="TasksClosed"', 'Sum', 86400)`,
              id: 'closed',
              label: 'Tasks closed',
            },
          ],
        ],
        stat: 'Sum',
        period: 86400,
      }),
      metricWidget({
        title: 'Average Time To Close',
        x: 0,
        y: 6,
        metrics: [
          [
            {
              expression: `SEARCH('{${namespace},TeamId} MetricName="TaskTimeToCloseSeconds"', 'Average', 86400)`,
              id: 'timeToClose',
              label: 'Avg seconds to close',
            },
          ],
        ],
        stat: 'Average',
        period: 86400,
      }),
      metricWidget({
        title: 'EC2 CPU Utilization',
        x: 12,
        y: 6,
        metrics: [
          [
            {
              expression: 'SEARCH(\'{AWS/EC2,InstanceId} MetricName="CPUUtilization"\', \'Average\', 300)',
              id: 'ec2cpu',
              label: 'EC2 CPU',
            },
          ],
        ],
        stat: 'Average',
        period: 300,
      }),
      metricWidget({
        title: 'Tasks Assigned',
        x: 0,
        y: 12,
        metrics: [[namespace, 'TasksAssigned']],
        stat: 'Sum',
        period: 300,
      }),
      metricWidget({
        title: 'Tasks Assigned Per Team',
        x: 12,
        y: 12,
        metrics: [
          [
            {
              expression: `SEARCH('{${namespace},TeamId} MetricName="TasksAssignedPerTeam"', 'Sum', 300)`,
              id: 'assigned',
              label: 'Tasks assigned',
            },
          ],
        ],
        stat: 'Sum',
        period: 300,
      }),
    ],
  };
}

function metricWidget({ title, x, y, metrics, stat, period }) {
  return {
    type: 'metric',
    x,
    y,
    width: 12,
    height: 6,
    properties: {
      title,
      region,
      view: 'timeSeries',
      stacked: false,
      metrics,
      stat,
      period,
    },
  };
}

main().catch((error) => {
  console.error('Failed to provision CloudWatch dashboard/alarm', error);
  process.exitCode = 1;
});

function loadEnvFiles(files) {
  for (const file of files) {
    const filePath = path.resolve(process.cwd(), file);

    if (!fs.existsSync(filePath)) {
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = stripQuotes(trimmed.slice(separatorIndex + 1).trim());

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
