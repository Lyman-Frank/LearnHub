var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@repo/shared';
let InvitesController = class InvitesController {
    invitesService;
    constructor(invitesService) {
        this.invitesService = invitesService;
    }
    async create(dto) {
        return this.invitesService.create(dto);
    }
    async findAll() {
        return this.invitesService.findAll();
    }
    async deactivate(id) {
        return this.invitesService.deactivate(id);
    }
};
__decorate([
    Post(),
    Roles(UserRole.ADMIN),
    ApiOperation({ summary: 'Создать новый инвайт-код (только для ADMIN)' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateInviteDto]),
    __metadata("design:returntype", Promise)
], InvitesController.prototype, "create", null);
__decorate([
    Get(),
    Roles(UserRole.ADMIN),
    ApiOperation({ summary: 'Получить список всех инвайт-кодов (только для ADMIN)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InvitesController.prototype, "findAll", null);
__decorate([
    Patch(':id/deactivate'),
    Roles(UserRole.ADMIN),
    ApiOperation({ summary: 'Деактивировать инвайт-код по ID (только для ADMIN)' }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvitesController.prototype, "deactivate", null);
InvitesController = __decorate([
    ApiTags('Invites (Инвайты)'),
    ApiBearerAuth(),
    UseGuards(JwtAuthGuard, RolesGuard),
    Controller('invites'),
    __metadata("design:paramtypes", [InvitesService])
], InvitesController);
export { InvitesController };
