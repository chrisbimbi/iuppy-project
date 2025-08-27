import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Express } from 'express';

function sanitizeFileName(name: string) {
    return name
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9.-]/g, '-');
}

@Controller('uploads')
export class UploadsController {
    @Post('logo')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: 'uploads',
            filename: (req, file, cb) => {
                const ext = extname(file.originalname) || '.png';
                const base = sanitizeFileName(file.originalname.replace(ext, '') || 'logo');
                const filename = `${Date.now()}-${base}${ext}`;
                cb(null, filename);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }))
    uploadLogo(@UploadedFile() file: Express.Multer.File) {
        const baseUrl = process.env.APP_URL || 'http://localhost:4000';
        return { url: `${baseUrl}/uploads/${file.filename}` };
    }
}