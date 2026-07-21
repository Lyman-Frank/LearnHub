import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InvitesModule } from './invites/invites.module';
import { CoursesModule } from './courses/courses.module';
import { ModulesModule } from './modules/modules.module';
import { LessonsModule } from './lessons/lessons.module';
import { StepsModule } from './steps/steps.module';
import { ProgressModule } from './progress/progress.module';
import { UploadModule } from './upload/upload.module';
import { BadgesModule } from './badges/badges.module';
import { CertificatesModule } from './certificates/certificates.module';
import { AiModule } from './ai/ai.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GroupsModule } from './groups/groups.module';
import { ShopModule } from './shop/shop.module';
import { MinigamesModule } from './minigames/minigames.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { SubscriptionGuard } from './auth/guards/subscription.guard';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: 1000,
            limit: 20,
          },
          {
            name: 'medium',
            ttl: 10000,
            limit: 100,
          },
          {
            name: 'long',
            ttl: 60000,
            limit: 300,
          },
        ],
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
      exclude: ['/api*'],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    InvitesModule,
    CoursesModule,
    ModulesModule,
    LessonsModule,
    StepsModule,
    ProgressModule,
    UploadModule,
    BadgesModule,
    CertificatesModule,
    AiModule,
    ChatModule,
    NotificationsModule,
    GroupsModule,
    ShopModule,
    MinigamesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
