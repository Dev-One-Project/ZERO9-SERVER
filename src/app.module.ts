import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { CacheModule, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import 'dotenv/config';
import { ProductModule } from './apis/product/product.module';
import { ImageModule } from './apis/images/image.module';
import { ProductLikeModule } from './apis/productLike/productLike.module';
import { UsersModule } from './apis/users/users.module';
import { AuthModule } from './apis/auth/auth.module';
import * as redisStore from 'cache-manager-redis-store';
import { RedisClientOptions } from 'redis';
import { QuestionModule } from './apis/question/question.module';
import { AnswerModule } from './apis/answer/answer.module';
import { PaymentsModule } from './apis/payments/payments.module';
import { PointsModule } from './apis/points/points.module';
import { OrdersModule } from './apis/orders/orders.module';
import { SearchModule } from './apis/search/search.module';
import { ProductViewModule } from './apis/productView/productView.module';

const originList = process.env.ORIGIN_LIST.split(',');

@Module({
  imports: [
    ProductModule,
    ProductLikeModule,
    ProductViewModule,
    ImageModule,
    AuthModule,
    UsersModule,
    QuestionModule,
    AnswerModule,
    PaymentsModule,
    PointsModule,
    OrdersModule,
    SearchModule,
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      cache: 'bounded',
      autoSchemaFile: 'src/common/graphql/schema.gql',
      context: ({ req, res }) => ({ req, res }),
      cors: {
        origin: [
          'http://localhost:3000',
          'https://localhost:3000',
          'http://localhost:4000',
          'https://localhost:4000',
          'https://zero9.shop',
          'https://zero9.brian-hong.tech',
        ],
        credentials: true,
        exposedHeaders: ['Set-Cookie', 'Cookie'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
        allowedHeaders: [
          'Access-Control-Allow-Origin',
          'Authorization',
          'X-Requested-With',
          'Content-Type',
          'Accept',
        ],
      },
    }),
    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE as 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [__dirname + '/apis/**/*.entity.*'],
      logging: true,
      synchronize: true,
    }),
    CacheModule.register<RedisClientOptions>({
      store: redisStore,
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
