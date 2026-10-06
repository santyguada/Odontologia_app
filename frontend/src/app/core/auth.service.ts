import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_URL } from './api';
import { LoginResponse, Usuario } from './models';

const CLAVE_TOKEN = 'token';
const CLAVE_USUARIO = 'usuario';

function leerUsuario(): Usuario | null {
  const guardado = localStorage.getItem(CLAVE_USUARIO);
  return guardado ? JSON.parse(guardado) : null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  // Usuario logueado (nombre y rol) o null
  usuario = signal<Usuario | null>(leerUsuario());

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, { email, password }).pipe(
      tap((respuesta) => {
        localStorage.setItem(CLAVE_TOKEN, respuesta.token);
        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(respuesta.usuario));
        this.usuario.set(respuesta.usuario);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    this.usuario.set(null);
  }

  token(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }
}
