import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';
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
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { SubscriptionGuard } from './auth/guards/subscription.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
      exclude: ['/api*'],
    }),
    PrismaModule,
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
  ],
})
export class AppModule {}
