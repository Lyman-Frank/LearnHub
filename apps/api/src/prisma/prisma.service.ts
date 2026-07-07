import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@repo/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async resetDraftStatus(courseId: string) {
    const course = await this.course.findUnique({ where: { id: courseId } });
    if (course && course.isDraft && course.status === 'PUBLISHED') {
      await this.course.update({
        where: { id: courseId },
        data: { status: 'DRAFT' },
      });
    }
  }
}
