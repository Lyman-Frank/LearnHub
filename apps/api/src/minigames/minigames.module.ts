import { Module } from '@nestjs/common';
import { MinigamesController } from './minigames.controller';
import { MinigamesService } from './minigames.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MinigamesController],
  providers: [MinigamesService],
  exports: [MinigamesService],
})
export class MinigamesModule {}
