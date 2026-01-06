
import { Inject, Injectable, Logger } from '@nestjs/common';
import { App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { FIREBASE_ADMIN } from '../notifications/firebase-admin.provider';

@Injectable()
export class FirebaseStorageService {
    private readonly logger = new Logger(FirebaseStorageService.name);

    constructor(@Inject(FIREBASE_ADMIN) private readonly firebaseApp: App) { }

    async uploadFile(
        fileBuffer: Buffer,
        fileName: string,
        mimeType: string,
        folder: string = 'uploads',
    ): Promise<string> {
        try {
            const bucket = getStorage(this.firebaseApp).bucket();
            const destination = `${folder}/${Date.now()}_${fileName}`;
            const file = bucket.file(destination);

            await file.save(fileBuffer, {
                metadata: {
                    contentType: mimeType,
                },
            });

            // Generate a long-lived signed URL (e.g., valid for 100 years)
            const [signedUrl] = await file.getSignedUrl({
                action: 'read',
                expires: '12-31-2100',
            });

            this.logger.log(`File uploaded to ${signedUrl}`);
            return signedUrl;
        } catch (error) {
            this.logger.error(`Error uploading to Firebase Storage: ${error}`);
            throw error;
        }
    }
}
