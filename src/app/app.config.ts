import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'chatarmony',
        appId: '1:895410760362:web:749b67410fb6a15699fed3',
        storageBucket: 'chatarmony.appspot.com',
        apiKey: 'AIzaSyB_kzeoeM_D1k9ABS1qQmc-1RfFYKPB9h0',
        authDomain: 'chatarmony.firebaseapp.com',
        messagingSenderId: '895410760362',
        measurementId: 'G-L9ZHKJYCG4',
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ],
};
