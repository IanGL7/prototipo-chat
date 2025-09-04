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
        apiKey: "AIzaSyAzeVIIPJkxcuuavZHpCKu2uMPmkPw7nb0",
  authDomain: "emonical-54299.firebaseapp.com",
  projectId: "emonical-54299",
  storageBucket: "emonical-54299.firebasestorage.app",
  messagingSenderId: "305428973717",
  appId: "1:305428973717:web:08a52b84b3bb3fd7a4339c"
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ],
};
