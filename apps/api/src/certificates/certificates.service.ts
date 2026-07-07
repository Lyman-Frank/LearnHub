import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

  constructor(private prisma: PrismaService) {}

  async generateCertificatePdf(userId: string, courseId: string): Promise<Uint8Array> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });

    if (!user || !course) {
      throw new NotFoundException('User or Course not found');
    }

    let cert = await this.prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } }
    });

    if (!cert) {
      cert = await this.prisma.certificate.create({
        data: {
          userId,
          courseId,
        }
      });
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 Landscape

    const { width, height } = page.getSize();
    
    // Background (Cyber Purple)
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0.05, 0.05, 0.1),
    });
    
    // Inner border
    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      borderColor: rgb(0.5, 0.0, 1.0),
      borderWidth: 4,
    });

    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helveticaNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Title
    const title = 'CERTIFICATE OF COMPLETION';
    const titleSize = 40;
    const titleWidth = helveticaFont.widthOfTextAtSize(title, titleSize);
    page.drawText(title, {
      x: width / 2 - titleWidth / 2,
      y: height - 120,
      size: titleSize,
      font: helveticaFont,
      color: rgb(0.7, 0.5, 1.0),
    });

    // Subtitle
    const subtitle = 'This is to certify that';
    const subtitleSize = 20;
    const subtitleWidth = helveticaNormal.widthOfTextAtSize(subtitle, subtitleSize);
    page.drawText(subtitle, {
      x: width / 2 - subtitleWidth / 2,
      y: height - 200,
      size: subtitleSize,
      font: helveticaNormal,
      color: rgb(0.8, 0.8, 0.8),
    });

    // User Name
    const userName = `${user.firstName} ${user.lastName}`;
    const nameSize = 48;
    const nameWidth = timesRomanFont.widthOfTextAtSize(userName, nameSize);
    page.drawText(userName, {
      x: width / 2 - nameWidth / 2,
      y: height - 280,
      size: nameSize,
      font: timesRomanFont,
      color: rgb(1, 1, 1),
    });

    // Achievement
    const achievementText = 'has successfully completed the course';
    const achSize = 20;
    const achWidth = helveticaNormal.widthOfTextAtSize(achievementText, achSize);
    page.drawText(achievementText, {
      x: width / 2 - achWidth / 2,
      y: height - 360,
      size: achSize,
      font: helveticaNormal,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Course Title
    const courseTitle = course.title;
    const courseSize = 36;
    const cWidth = helveticaFont.widthOfTextAtSize(courseTitle, courseSize);
    page.drawText(courseTitle, {
      x: width / 2 - cWidth / 2,
      y: height - 440,
      size: courseSize,
      font: helveticaFont,
      color: rgb(0.5, 0.8, 1.0),
    });

    // Date
    const dateStr = `Date: ${cert.issuedAt.toLocaleDateString('en-US')}`;
    page.drawText(dateStr, {
      x: 100,
      y: 80,
      size: 16,
      font: helveticaNormal,
      color: rgb(0.7, 0.7, 0.7),
    });

    // Platform
    page.drawText('LearnHub Education', {
      x: width - 250,
      y: 80,
      size: 16,
      font: helveticaFont,
      color: rgb(0.7, 0.7, 0.7),
    });

    return await pdfDoc.save();
  }

  async getUserCertificates(userId: string) {
    // 1. Самолечение: Находим все курсы, на которые записан пользователь
    try {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            include: {
              modules: {
                include: {
                  lessons: {
                    include: { steps: { select: { id: true } } }
                  }
                }
              }
            }
          }
        }
      });

      for (const enc of enrollments) {
        const courseId = enc.courseId;
        const allStepIds = enc.course.modules.flatMap(m =>
          m.lessons.flatMap(l => l.steps.map(s => s.id))
        );

        if (allStepIds.length > 0) {
          const completedCount = await this.prisma.stepProgress.count({
            where: { userId, stepId: { in: allStepIds }, isCompleted: true }
          });

          if (completedCount === allStepIds.length) {
            // Курс пройден полностью! Проверяем наличие сертификата
            const existingCert = await this.prisma.certificate.findUnique({
              where: { userId_courseId: { userId, courseId } }
            });
            if (!existingCert) {
              await this.prisma.certificate.create({
                data: { userId, courseId }
              });
            }
          }
        }
      }
    } catch (err) {
      this.logger.error(`Ошибка при авто-генерации сертификатов (самолечении): ${err.message}`);
    }

    // 2. Возвращаем сертификаты
    return this.prisma.certificate.findMany({
      where: { userId },
      include: {
        course: { select: { title: true, coverUrl: true } }
      },
      orderBy: { issuedAt: 'desc' },
    });
  }
}
