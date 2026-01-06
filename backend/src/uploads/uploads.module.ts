import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { FirebaseStorageService } from './firebase-storage.service';
import { NotificationsModule } from '../notifications/notifications.module'; // for FIREBASE_ADMIN

@Module({
  imports: [NotificationsModule],
  controllers: [UploadsController],
  providers: [FirebaseStorageService],
  exports: [FirebaseStorageService],
})
export class UploadsModule { }
