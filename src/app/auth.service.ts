import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { environment } from '../environments/environment';

// 🔹 Tambahkan import ini
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const app = initializeApp(environment.firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // 🔹 method login di dalam class
  login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  register(email: string, password: string) {
    return createUserWithEmailAndPassword(auth, email, password);
  }
}
