import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { CodeSandboxService } from './code-sandbox.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BadgesModule } from '../badges/badges.module';

@Module({
  imports: [PrismaModule, BadgesModule],
  controllers: [ProgressController],
  providers: [ProgressService, CodeSandboxService],
  exports: [ProgressService, CodeSandboxService],
})
export class ProgressModule {}
