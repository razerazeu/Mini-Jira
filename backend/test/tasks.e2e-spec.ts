import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { S3Service } from '../src/aws/s3.service';
import { DynamoDBService } from '../src/aws/dynamodb.service';
import { CognitoService } from '../src/auth/cognito.service';
import jwt from 'jsonwebtoken';

const managerAuth = { Authorization: 'Bearer manager-1' };
const otherAuth = { Authorization: 'Bearer user-2' };

describe('Tasks API behaviors', () => {
  let app: INestApplication;
  let createdTeamId = 'team-A';
  const users: Record<string, any> = {
    u1: {
      userId: 'u1',
      email: 'u1@example.com',
      role: 'EMPLOYEE',
      teamId: undefined,
      isActive: true,
    },
  };

  beforeAll(async () => {
    process.env.USE_DYNAMODB = 'false';
    jest.spyOn(jwt, 'verify').mockImplementation((token, getKey, options, callback) => {
      const tokenText = String(token);
      const payload = tokenText.includes('user-2')
        ? {
            sub: 'user-2',
            client_id: '3a3ch08jvain113or80pcgqq08',
            email: 'other@example.com',
            name: 'Other User',
            'custom:role': 'user',
            'custom:teamId': 'team-B',
            'cognito:groups': [],
            token_use: 'access',
          }
        : {
            sub: 'manager-1',
            client_id: '3a3ch08jvain113or80pcgqq08',
            email: 'manager@example.com',
            name: 'Manager',
            'custom:role': 'manager',
            'custom:teamId': 'team-A',
            'cognito:groups': [],
            token_use: 'access',
          };

      callback(null, payload as any);
    });

    const mockS3 = {
      uploadObject: async () => ({ VersionId: 'v1' }),
      getPresignedGetUrl: () => 'https://example.com/object',
    };
    const mockDynamo = {
      table: (name: string) => name,
      get: async ({ Key }) => ({
        Item: Key.userId ? users[Key.userId] : null,
      }),
      scan: async () => ({ Items: [] }),
      put: async ({ Item }) => {
        if (Item.userId) users[Item.userId] = Item;
        return {};
      },
      delete: async () => ({}),
      query: async () => ({ Items: [] }),
    };
    const mockCognito = {
      updateMembership: async () => ({}),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(S3Service)
      .useValue(mockS3)
      .overrideProvider(DynamoDBService)
      .useValue(mockDynamo)
      .overrideProvider(CognitoService)
      .useValue(mockCognito)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('validates DTO on create (400)', async () => {
    await request(app.getHttpServer())
      .post('/tasks')
      .set(managerAuth)
      .send({ projectId: 'p1', priority: 'MEDIUM', deadline: new Date().toISOString(), assigneeId: 'u1', teamId: 'team-A' })
      .expect(400);
  });

  it('rejects task deadlines before today on create (400)', async () => {
    await request(app.getHttpServer())
      .post('/tasks')
      .set(managerAuth)
      .send({
        projectId: 'p1',
        title: 'past deadline',
        priority: 'MEDIUM',
        deadline: dateOnly(-1),
        assigneeId: 'u1',
        teamId: 'team-A',
      })
      .expect(400);
  });

  it('create, update, status, delete, and forbidden team access', async () => {
    const teamRes = await request(app.getHttpServer())
      .post('/teams')
      .set(managerAuth)
      .send({ name: 'Team A' })
      .expect(201);
    const teamId = teamRes.body.teamId;
    createdTeamId = teamId;

    await request(app.getHttpServer())
      .post('/teams')
      .set(managerAuth)
      .send({ name: 'team a' })
      .expect(400);

    await request(app.getHttpServer())
      .patch('/users/u1/team')
      .set(managerAuth)
      .send({ teamId })
      .expect(200)
      .expect((res) => {
        if (res.body.teamId !== teamId) throw new Error('teamId not assigned');
      });

    // create project
    const p = await request(app.getHttpServer())
      .post('/projects')
      .set(managerAuth)
      .send({ name: 'tproj', description: 'x' })
      .expect(201);

    const project = p.body;

    // create task as manager team-A (default)
    const tRes = await request(app.getHttpServer())
      .post('/tasks')
      .set(managerAuth)
      .send({
        projectId: project.id,
        title: 'task A',
        description: 'd',
        priority: 'HIGH',
        deadline: new Date(Date.now() + 3600 * 1000).toISOString(),
        assigneeId: 'u1',
        teamId,
      })
      .expect(201);

    const task = tRes.body;

    await request(app.getHttpServer())
      .put(`/tasks/${task.id}`)
      .set(managerAuth)
      .send({ deadline: dateOnly(-1) })
      .expect(400);

    // update as same team manager
    await request(app.getHttpServer())
      .put(`/tasks/${task.id}`)
      .set(managerAuth)
      .send({ title: 'task A updated' })
      .expect(200)
      .expect((res) => {
        if (res.body.title !== 'task A updated') throw new Error('title not updated');
      });

    // status update as same team
    await request(app.getHttpServer())
      .patch(`/tasks/${task.id}/status`)
      .set(managerAuth)
      .send({ status: 'IN_PROGRESS' })
      .expect(200)
      .expect((res) => {
        if (res.body.status !== 'IN_PROGRESS') throw new Error('status not updated');
      });

    // attempt actions as a user from another team -> expect 403
    await request(app.getHttpServer())
      .put(`/tasks/${task.id}`)
      .set(otherAuth)
      .send({ title: 'bad update' })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/tasks/${task.id}/status`)
      .set(otherAuth)
      .send({ status: 'DONE' })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/tasks/${task.id}`)
      .set(otherAuth)
      .expect(403);

    // delete as original manager
    await request(app.getHttpServer())
      .delete(`/tasks/${task.id}`)
      .set(managerAuth)
      .expect(200)
      .expect((res) => {
        if (!res.body.message) throw new Error('no delete message');
      });
  }, 20000);
});

function dateOnly(dayOffset: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date.toISOString().slice(0, 10);
}
