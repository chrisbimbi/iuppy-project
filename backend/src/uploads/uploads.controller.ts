import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import type { Express } from 'express';
import { FirebaseStorageService } from './firebase-storage.service';

function sanitizeFileName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.-]/g, '-');
}

@Controller('uploads')
export class UploadsController {
  constructor(private readonly firebaseStorage: FirebaseStorageService) { }

  @Post('logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    const ext = extname(file.originalname) || '.png';
    const base = sanitizeFileName(file.originalname.replace(ext, '') || 'logo');
    const filename = `${base}${ext}`;

    const url = await this.firebaseStorage.uploadFile(
      file.buffer,
      filename,
      file.mimetype,
      'logos'
    );
    return { url };
  }

  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const ext = extname(file.originalname) || '.bin';
    const base = sanitizeFileName(file.originalname.replace(ext, '') || 'file');
    const filename = `${base}${ext}`;

    const url = await this.firebaseStorage.uploadFile(
      file.buffer,
      filename,
      file.mimetype,
      'chat_files'
    );
    return { url };
  }
}
