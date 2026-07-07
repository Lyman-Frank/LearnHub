var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@repo/shared';
export class RegisterDto {
    email;
    password;
    firstName;
    lastName;
    role;
    inviteCode;
}
__decorate([
    ApiProperty({ example: 'student@example.com', description: 'Электронная почта' }),
    IsEmail(),
    IsNotEmpty(),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    ApiProperty({ example: 'password123', description: 'Пароль (мин. 6 символов)' }),
    IsString(),
    MinLength(6),
    MaxLength(100),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    ApiProperty({ example: 'Иван', description: 'Имя' }),
    IsString(),
    IsNotEmpty(),
    MaxLength(50),
    __metadata("design:type", String)
], RegisterDto.prototype, "firstName", void 0);
__decorate([
    ApiProperty({ example: 'Иванов', description: 'Фамилия' }),
    IsString(),
    IsNotEmpty(),
    MaxLength(50),
    __metadata("design:type", String)
], RegisterDto.prototype, "lastName", void 0);
__decorate([
    ApiPropertyOptional({ enum: UserRole, default: UserRole.STUDENT, description: 'Роль пользователя' }),
    IsOptional(),
    IsEnum(UserRole),
    __metadata("design:type", typeof (_a = typeof UserRole !== "undefined" && UserRole) === "function" ? _a : Object)
], RegisterDto.prototype, "role", void 0);
__decorate([
    ApiPropertyOptional({ example: 'TEACH-ABCD-1234', description: 'Инвайт-код (обязательно для TEACHER)' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], RegisterDto.prototype, "inviteCode", void 0);
