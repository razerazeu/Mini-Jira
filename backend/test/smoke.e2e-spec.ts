import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { S3Service } from '../src/aws/s3.service';
import jwt from 'jsonwebtoken';

const authHeader = { Authorization: 'Bearer test-token' };

describe('API smoke tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.USE_DYNAMODB = 'false';
    jest.spyOn(jwt, 'verify').mockImplementation((token, getKey, options, callback) => {
      callback(null, {
        sub: 'test-user',
        client_id: '3a3ch08jvain113or80pcgqq08',
        email: 'test@example.com',
        name: 'Test User',
        'custom:role': 'manager',
        'custom:teamId': 'team-1',
        'cognito:groups': [],
        token_use: 'access',
      } as any);
    });

    const mockS3 = {
      uploadObject: async () => ({ VersionId: 'v1' }),
      getPresignedGetUrl: () => 'https://example.com/object',
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(S3Service)
      .useValue(mockS3)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates project -> creates task -> comments -> image lifecycle', async () => {
    // create project
    const projectRes = await request(app.getHttpServer())
      .post('/projects')
      .set(authHeader)
      .send({ name: 'smoke project', description: 'for smoke' })
      .expect(201);

    const project = projectRes.body;

    // create task
    const taskRes = await request(app.getHttpServer())
      .post('/tasks')
      .set(authHeader)
      .send({
        projectId: project.id,
        title: 'smoke task',
        description: 'do things',
        priority: 'MEDIUM',
        deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        assigneeId: 'test-user',
        teamId: 'team-1',
      })
      .expect(201);

    const task = taskRes.body;

    // add comment
    const commentRes = await request(app.getHttpServer())
      .post(`/tasks/${task.id}/comments`)
      .set(authHeader)
      .send({ text: 'nice' })
      .expect(201);

    // list comments
    await request(app.getHttpServer())
      .get(`/tasks/${task.id}/comments`)
      .set(authHeader)
      .expect(200)
      .expect((res) => {
        if (!Array.isArray(res.body)) throw new Error('comments not array');
      });

    // upload image (mocked S3)
    await request(app.getHttpServer())
      .post(`/tasks/${task.id}/image`)
      .set(authHeader)
      .attach('file', Buffer.from('abc'), 'a.txt')
      .expect(201);

    // replace image
    await request(app.getHttpServer())
      .put(`/tasks/${task.id}/image`)
      .set(authHeader)
      .attach('file', Buffer.from('def'), 'b.txt')
      .expect(200);

    // delete image
    await request(app.getHttpServer())
      .delete(`/tasks/${task.id}/image`)
      .set(authHeader)
      .expect(200);
  }, 20000);
});
