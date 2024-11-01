import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser,
} from '@angular/fire/auth';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _auth = inject(Auth);

  constructor() {}

  /**
   * Método para registrar un nuevo usuario usando correo electrónico y contraseña.
   * @param user Objeto con el correo electrónico y la contraseña del usuario.
   * @returns Promesa que resuelve con las credenciales del usuario registrado.
   */
  signUp(user: { email: string; password: string }) {
    return createUserWithEmailAndPassword(
      this._auth,
      user.email,
      user.password
    );
  }

  /**
   * Método para iniciar sesión con correo electrónico y contraseña.
   * @param user Objeto con el correo electrónico y la contraseña del usuario.
   * @returns Promesa que resuelve con las credenciales del usuario autenticado.
   */
  signIn(user: { email: string; password: string }) {
    return signInWithEmailAndPassword(this._auth, user.email, user.password);
  }

  /**
   * Método para iniciar sesión con Google.
   * @returns Promesa que resuelve con las credenciales del usuario autenticado con Google.
   */
  signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this._auth, provider);
  }

  /**
   * Observable que emite el usuario autenticado actual.
   * Este observable se actualiza automáticamente cuando cambia el estado de autenticación.
   * @returns Observable que emite el usuario de Firebase o null si no hay usuario autenticado.
   */
  get currentUser$(): Observable<FirebaseUser | null> {
    return new Observable((observer) => {
      this._auth.onAuthStateChanged((user) => observer.next(user));
    });
  }

  /**
   * Método para cerrar sesión.
   * @returns Promesa que se resuelve cuando el usuario cierra sesión exitosamente.
   */
  logout() {
    return this._auth.signOut();
  }
}
