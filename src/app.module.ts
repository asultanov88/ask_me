import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProvidersModule } from './providers/providers.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseEntity } from './database/entities/database';

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
      synchronize: false,
      options: { trustServerCertificate: true }
    }),
    ProvidersModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
