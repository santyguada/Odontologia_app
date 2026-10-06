export type EstadoTurno = 'pendiente' | 'confirmado' | 'cancelado' | 'atendido';
export type Rol = 'admin' | 'odontologo';

export interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  obraSocial: string | null;
}

export interface Turno {
  id: number;
  codigo: string; // 'T-XXXXX'
  fecha: string; // 'YYYY-MM-DD'
  hora: string; // 'HH:mm'
  estado: EstadoTurno;
  paciente: Paciente;
}

export interface NuevoTurnoDto {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  obraSocial?: string;
  fecha: string;
  hora: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  rol: Rol;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface ApiError {
  error: string;
}
