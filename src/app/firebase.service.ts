import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { environment } from '../environments/environment';

// =======================================
// INITIALIZE FIREBASE APP
// =======================================
export const app = initializeApp(environment.firebaseConfig);

// =======================================
// AUTHENTICATION
// =======================================
export const auth = getAuth(app);

// =======================================
// REALTIME DATABASE
// =======================================
export const database = getDatabase(app);

// =======================================
// STORAGE (for uploading images)
// =======================================
export const storage = getStorage(app);

// =======================================
// OPTIONAL SERVICE WRAPPER
// =======================================
@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  // Kamu bisa taruh helper atau fungsi Firebase tambahan di sini nanti.
}
