// ensure AuthModule doesn't register the real Cognito guard
process.env.SKIP_AUTH = 'true';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { S3Service } from '../src/aws/s3.service';

describe('Tasks API behaviors', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mockGuard = {
      canActivate: (ctx: any) => {
        const req = ctx.switchToHttp().getRequest();
        const header = req.headers['x-test-user'];
        if (header) {
          try {
            req.user = JSON.parse(Array.isArray(header) ? header[0] : header);
          } catch {
            req.user = { userId: 'bad', role: 'user', teamId: 'team-B' };
          }
        } else {
          req.user = { userId: 'manager-1', name: 'Manager', role: 'manager', teamId: 'team-A' };
        }
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
      .overrideProvider(S3Service)
      .useValue(mockS3)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalGuards(mockGuard as any);
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
      .send({ projectId: 'p1', priority: 'MEDIUM', deadline: new Date().toISOString(), assigneeId: 'u1', teamId: 'team-A' })
      .expect(400);
  });

  it('create, update, status, delete, and forbidden team access', async () => {
    // create project
    const p = await request(app.getHttpServer())
      .post('/projects')
      .send({ name: 'tproj', description: 'x' })
      .expect(201);

    const project = p.body;

    // create task as manager team-A (default)
    const tRes = await request(app.getHttpServer())
      .post('/tasks')
      .send({
        projectId: project.id,
        title: 'task A',
        description: 'd',
        priority: 'HIGH',
        deadline: new Date(Date.now() + 3600 * 1000).toISOString(),
        assigneeId: 'u1',
        teamId: 'team-A',
      })
      .expect(201);

    const task = tRes.body;

    // update as same team manager
    await request(app.getHttpServer())
      .put(`/tasks/${task.id}`)
      .send({ title: 'task A updated' })
      .expect(200)
      .expect((res) => {
        if (res.body.title !== 'task A updated') throw new Error('title not updated');
      });

    // status update as same team
    await request(app.getHttpServer())
      .patch(`/tasks/${task.id}/status`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200)
      .expect((res) => {
        if (res.body.status !== 'IN_PROGRESS') throw new Error('status not updated');
      });

    // attempt actions as a user from another team -> expect 403
    const otherUser = JSON.stringify({ userId: 'u2', role: 'user', teamId: 'team-B' });

    await request(app.getHttpServer())
      .put(`/tasks/${task.id}`)
      .set('x-test-user', otherUser)
      .send({ title: 'bad update' })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/tasks/${task.id}/status`)
      .set('x-test-user', otherUser)
      .send({ status: 'DONE' })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/tasks/${task.id}`)
      .set('x-test-user', otherUser)
      .expect(403);

    // delete as original manager
    await request(app.getHttpServer())
      .delete(`/tasks/${task.id}`)
      .expect(200)
      .expect((res) => {
        if (!res.body.message) throw new Error('no delete message');
      });
  }, 20000);
});
