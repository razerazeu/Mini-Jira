export const dynamoDbTableConfig = {
  users: {
    envKey: 'DYNAMODB_USERS_TABLE',
  },
  teams: {
    envKey: 'DYNAMODB_TEAMS_TABLE',
  },
  projects: {
    envKey: 'DYNAMODB_PROJECTS_TABLE',
  },
  tasks: {
    envKey: 'DYNAMODB_TASKS_TABLE',
  },
  comments: {
    envKey: 'DYNAMODB_COMMENTS_TABLE',
  },
  activityLog: {
    envKey: 'DYNAMODB_ACTIVITY_LOG_TABLE',
  },
  auditLog: {
    envKey: 'DYNAMODB_AUDIT_LOG_TABLE',
  },
} as const;

export type DynamoDbTableName = keyof typeof dynamoDbTableConfig;
