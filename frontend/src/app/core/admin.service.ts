import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api';
import { EstadoTurno, NuevoTurnoDto, Turno } from './models';

// Endpoints del panel. El token lo agrega authInterceptor.
@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  listar(fecha: string): Observable<Turno[]> {
    return this.http.get<Turno[]>(`${API_URL}/admin/turnos`, { params: { fecha } });
  }

  cambiarEstado(id: number, estado: EstadoTurno): Observable<Turno> {
    return this.http.patch<Turno>(`${API_URL}/admin/turnos/${id}/estado`, { estado });
  }

  crear(dto: NuevoTurnoDto): Observable<Turno> {
    return this.http.post<Turno>(`${API_URL}/admin/turnos`, dto);
  }

  reprogramar(id: number, fecha: string, hora: string): Observable<Turno> {
    return this.http.patch<Turno>(`${API_URL}/admin/turnos/${id}/reprogramar`, { fecha, hora });
  }
}
