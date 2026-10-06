import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_URL } from './api';
import { NuevoTurnoDto, Turno } from './models';

// Endpoints públicos (paciente)
@Injectable({ providedIn: 'root' })
export class TurnosService {
  private http = inject(HttpClient);

  // Último turno reservado, lo lee la pantalla de confirmación
  ultimoTurno = signal<Turno | null>(null);

  disponibles(fecha: string): Observable<string[]> {
    return this.http.get<string[]>(`${API_URL}/turnos/disponibles`, { params: { fecha } });
  }

  crear(dto: NuevoTurnoDto): Observable<Turno> {
    return this.http.post<Turno>(`${API_URL}/turnos`, dto).pipe(tap((turno) => this.ultimoTurno.set(turno)));
  }

  buscar(codigo: string, dni: string): Observable<Turno> {
    return this.http.get<Turno>(`${API_URL}/turnos/${codigo}`, { params: { dni } });
  }

  cancelar(codigo: string, dni: string): Observable<Turno> {
    return this.http.patch<Turno>(`${API_URL}/turnos/${codigo}/cancelar`, { dni });
  }

  reprogramar(codigo: string, dni: string, fecha: string, hora: string): Observable<Turno> {
    return this.http.patch<Turno>(`${API_URL}/turnos/${codigo}/reprogramar`, { dni, fecha, hora });
  }
}
