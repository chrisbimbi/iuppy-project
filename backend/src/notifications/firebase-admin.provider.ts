import { Provider, Logger } from '@nestjs/common';
import {
  initializeApp,
  applicationDefault,
  cert,
  App,
  getApps,
} from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import * as fs from 'fs';

export const FIREBASE_ADMIN = 'FIREBASE_ADMIN_APP';
export const FIREBASE_MESSAGING = 'FIREBASE_MESSAGING';

const log = new Logger('FirebaseAdminProvider');

export const FirebaseAdminProvider: Provider[] = [
  {
    provide: FIREBASE_ADMIN,
    useFactory: () => {
      const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const fileExists = !!credPath && fs.existsSync(credPath);

      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      const usingADC = !!fileExists;
      log.log(
        `Iniciando Firebase Admin via ${usingADC ? 'Application Default Credentials (arquivo JSON)' : 'ENV PRIVATE_KEY'}`,
      );

      const app: App =
        getApps()[0] ??
        initializeApp(
          usingADC
            ? {
              credential: applicationDefault(),
              projectId: projectId || undefined,
              storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'iuppy-app.firebasestorage.app',
            }
            : {
              credential: cert({
                projectId: projectId!,
                clientEmail: clientEmail!,
                privateKey: privateKey?.includes('\\n')
                  ? privateKey.replace(/\\n/g, '\n')
                  : (privateKey as string),
              }),
              projectId: projectId || undefined,
              storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'iuppy-app.firebasestorage.app',
            },
        );

      return app;
    },
  },
  {
    provide: FIREBASE_MESSAGING,
    useFactory: (app: App) => getMessaging(app),
    inject: [FIREBASE_ADMIN],
  },
];
