import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import jwt from 'jsonwebtoken';

const authHeader = { Authorization: 'Bearer test-token' };
describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('/api (GET)', async () => {
    await request(app.getHttpServer())
      .get('/api')
      .set(authHeader)
      .expect(200)
      .expect('Hello World!');
  });

  afterEach(async () => {
    await app.close();
  });
});
