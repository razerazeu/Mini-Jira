# Mini-Jira

Mini-Jira is a full-stack task management application built with NestJS, Next.js, TypeScript, and AWS services. It supports manager and employee workflows, team-based access, project organization, task assignment, Kanban-style status tracking, comments, activity logs, image attachments, and notification hooks.

## Live Deployment

Production URL:

```text
https://d1b49icyii2w9p.cloudfront.net/
```

## Demo Video

https://github.com/user-attachments/assets/7e49e44d-6221-4e80-b2c9-6f7135523897

## Architecture


<img width="1290" height="701" alt="Architecture" src="https://github.com/user-attachments/assets/629079f2-a261-430a-812e-814bebbb065d" />

At a high level:

- The frontend is a Next.js application served through CloudFront.
- The backend is a NestJS API exposed behind an Application Load Balancer.
- CloudFront routes `/api/*` requests to the backend origin and all other paths to the frontend origin.
- Authentication is handled with Amazon Cognito.
- Application data is stored in DynamoDB.
- Task images are stored in S3.
- Notifications and background workflows use SNS, SQS, Lambda, and CloudWatch.

## Features

- Role-based access for managers and employees
- Team management and user assignment
- Project creation with team ownership
- Task creation, assignment, update, and deletion
- Kanban board grouped by task status
- Task detail pages with comments and activity history
- Image upload, replacement, and deletion for tasks
- CloudWatch metrics for task creation and completion
- Email notification hooks for assignments, alarms, and digests

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Axios
- React Hook Form
- Zod
- dnd-kit
- Lucide React

### Backend

- NestJS 11
- TypeScript
- AWS SDK v3
- Cognito
- DynamoDB
- S3
- SNS
- SQS
- CloudWatch

## Repository Structure

```text
.
+-- backend/                 NestJS API
+-- frontend/                Next.js application
+-- lambdas/
|   +-- assignment-worker/   Assignment notification worker
|   +-- daily-digest/        Daily digest worker
|   +-- image-resize/        Image resize worker
```

## API Routing

The backend is mounted under the `/api` prefix.

Common routes:

```text
POST   /api/auth/signup
POST   /api/auth/signin
GET    /api/health
GET    /api/users
PATCH  /api/users/:userId/team
GET    /api/teams
POST   /api/teams
GET    /api/projects
POST   /api/projects
GET    /api/tasks
POST   /api/tasks
PATCH  /api/tasks/:id/status
GET    /api/tasks/:id/comments
POST   /api/tasks/:id/comments
POST   /api/tasks/:id/image
PUT    /api/tasks/:id/image
DELETE /api/tasks/:id/image
```

## Local Development

### Prerequisites

- Node.js 18 or newer
- npm
- AWS credentials and service configuration for full AWS-backed behavior

For local-only development, some backend services can run with in-memory data by setting:

```env
USE_DYNAMODB=false
```

### Backend

```bash
cd backend
npm install
npm run start:dev
```

The API listens on:

```text
http://localhost:5000/api
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend listens on:

```text
http://localhost:3001
```

Set the frontend API base in `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Backend Environment Variables

The backend expects these variables for AWS-backed operation:

```env
PORT=5000
AWS_REGION=eu-north-1

COGNITO_USER_POOL_ID=
COGNITO_APP_CLIENT_ID=
COGNITO_CLIENT_ID=
COGNITO_JWKS_URL=

DYNAMODB_USERS_TABLE=
DYNAMODB_TEAMS_TABLE=
DYNAMODB_PROJECTS_TABLE=
DYNAMODB_TASKS_TABLE=
DYNAMODB_COMMENTS_TABLE=
DYNAMODB_ACTIVITY_LOG_TABLE=

TASKS_TEAM_INDEX=
COMMENTS_TASK_INDEX=
ACTIVITY_LOG_TASK_INDEX=

S3_ORIGINALS_BUCKET=
S3_BUCKET=

SNS_TASK_ASSIGNMENT_TOPIC_ARN=
SNS_DAILY_DIGEST_TOPIC_ARN=
SNS_ALARM_TOPIC_ARN=

CLOUDWATCH_NAMESPACE=MiniJira
USE_DYNAMODB=true
```

Some variables are optional depending on which infrastructure features are enabled, but Cognito and AWS region are required for authenticated backend startup.

## Deployment Notes

For AWS deployment behind CloudFront:

```text
/api/* -> ALB backend origin
/*     -> frontend origin
```

The frontend build environment should include:

```env
NEXT_PUBLIC_API_URL=https://d1b49icyii2w9p.cloudfront.net/api
```

CloudFront `/api/*` should allow all API methods:

```text
GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
```

It should also forward:

```text
Authorization
Content-Type
Query strings
```

The ALB health check should target:

```text
/api/health
```

## Verification

Backend:

```bash
cd backend
npm run build
npm run test:e2e
```

Frontend:

```bash
cd frontend
npm exec tsc -- --noEmit
npm run build
```

If `npm run build` fails while fetching Google Fonts, verify that the build environment has outbound network access or replace the remote font dependency with a local font.

## Current Status

- Root API prefix is `/api`.
- Frontend API calls use `NEXT_PUBLIC_API_URL`.
- Cognito signup auto-confirms users after creation.
- Projects can be assigned to teams during project creation or editing.
