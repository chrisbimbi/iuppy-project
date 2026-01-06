import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserImportService } from './user-import.service';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Request } from 'express';

@Controller('users/import')
@UseGuards(JwtAccessGuard)
export class UserImportController {
  constructor(private readonly importService: UserImportService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('syncKey') syncKey: string,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('Arquivo não enviado');

    // Get companyId from authenticated user
    const user = (req as any).user;
    const companyId = user?.companyId;

    if (!companyId)
      throw new BadRequestException('Usuário sem empresa vinculada');

    const result = await this.importService.importUsers(
      companyId,
      file.buffer,
      file.originalname,
      syncKey || 'email',
    );

    return result;
  }
}
