import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProvidersModule } from './providers/providers.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseEntity } from './database/entities/database';
import { GatewayModule } from './gateway/gateway.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ErrorHandler } from './Helper/ErrorHandler';
import { KeyUpperCaseMiddleware } from './middleware/keyUppserCase.middleware';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT, 10),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [DatabaseEntity],
      synchronize: true,
      options: { trustServerCertificate: true }
    }),
    GatewayModule,
    ProvidersModule,
    AuthModule,
    UsersModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(KeyUpperCaseMiddleware).forRoutes('*');
  }
}
