import { Controller, Get, Param, Res, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';

@ApiTags('certificates')
@Controller('certificates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get('my')
  @ApiOperation({ summary: 'Get all certificates earned by the current user' })
  async getMyCertificates(@Req() req) {
    return this.certificatesService.getUserCertificates(req.user.id);
  }

  @Get(':courseId/download')
  @ApiOperation({ summary: 'Download PDF certificate for a specific course' })
  async downloadCertificate(@Req() req, @Param('courseId') courseId: string, @Res() res: Response) {
    try {
      const pdfBytes = await this.certificatesService.generateCertificatePdf(req.user.id, courseId);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=certificate_${courseId}.pdf`);
      res.setHeader('Content-Length', pdfBytes.length);
      
      res.end(Buffer.from(pdfBytes));
    } catch (e) {
      throw new NotFoundException(e.message);
    }
  }
}
