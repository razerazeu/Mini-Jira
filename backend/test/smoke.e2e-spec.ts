// ensure the real cognito guard is not registered in AuthModule during tests
process.env.SKIP_AUTH = 'true';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { APP_GUARD } from '@nestjs/core';
import { S3Service } from '../src/aws/s3.service';

describe('API smoke tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // ensure the real cognito guard is not registered in AuthModule
    process.env.SKIP_AUTH = 'true';
    const mockGuard = {
      canActivate: (ctx: any) => {
        // debug: indicate mock guard was invoked
        // eslint-disable-next-line no-console
        console.log('mockGuard invoked');
        const req = ctx.switchToHttp().getRequest();
        req.user = {
          userId: 'test-user',
          name: 'Test User',
          role: 'manager',
          teamId: 'team-1',
        };
        return true;
      },
    };

    const mockS3 = {
      uploadObject: async () => ({ VersionId: 'v1' }),
      getPresignedGetUrl: () => 'https://example.com/object',
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(APP_GUARD)
      .useValue(mockGuard)
      .overrideProvider(S3Service)
      .useValue(mockS3)
      .compile();

    app = moduleFixture.createNestApplication();
    // ensure our mock guard is applied at app level in case APP_GUARD from module still runs
    // (this overrides module-level guards for the test application)
    app.useGlobalGuards(mockGuard as any);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates project -> creates task -> comments -> image lifecycle', async () => {
    // create project
    const projectRes = await request(app.getHttpServer())
      .post('/projects')
      .send({ name: 'smoke project', description: 'for smoke' })
      .expect(201);

    const project = projectRes.body;

    // create task
    const taskRes = await request(app.getHttpServer())
      .post('/tasks')
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
      .send({ text: 'nice' })
      .expect(201);

    // list comments
    await request(app.getHttpServer())
      .get(`/tasks/${task.id}/comments`)
      .expect(200)
      .expect((res) => {
        if (!Array.isArray(res.body)) throw new Error('comments not array');
      });

    // upload image (mocked S3)
    await request(app.getHttpServer())
      .post(`/tasks/${task.id}/image`)
      .attach('file', Buffer.from('abc'), 'a.txt')
      .expect(201);

    // replace image
    await request(app.getHttpServer())
      .put(`/tasks/${task.id}/image`)
      .attach('file', Buffer.from('def'), 'b.txt')
      .expect(200);

    // delete image
    await request(app.getHttpServer())
      .delete(`/tasks/${task.id}/image`)
      .expect(200);
  }, 20000);
});
