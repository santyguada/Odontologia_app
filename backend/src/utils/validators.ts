import { HORARIOS, esDiaHabil, formatoFecha, hoy, horaActual } from './horarios';

// Cada función devuelve el primer error encontrado (mensaje) o null si todo está bien

const REGEX_DNI = /^\d{7,8}$/;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_TELEFONO = /^\d{8,15}$/;
const REGEX_NOMBRE = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+( [A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/;
const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_CODIGO = /^T-[A-Z0-9]{5}$/;
const ESTADOS = ['pendiente', 'confirmado', 'cancelado', 'atendido'];

function esTexto(valor: unknown): valor is string {
  return typeof valor === 'string';
}

export function validarFormatoFecha(fecha: unknown): string | null {
  if (!esTexto(fecha) || !REGEX_FECHA.test(fecha)) {
    return 'La fecha debe tener formato YYYY-MM-DD';
  }
  // Si la fecha no existe (ej. 2026-02-30), Date la corre a otro día y no coincide
  const d = new Date(fecha + 'T00:00:00');
  if (isNaN(d.getTime()) || formatoFecha(d) !== fecha) return 'La fecha no es válida';
  return null;
}

// Fecha consultable para turnos: formato válido, no pasada y de lunes a viernes
export function validarFecha(fecha: unknown): string | null {
  const error = validarFormatoFecha(fecha);
  if (error) return error;
  if ((fecha as string) < hoy()) return 'La fecha no puede ser pasada';
  if (!esDiaHabil(fecha as string)) return 'El consultorio atiende de lunes a viernes';
  return null;
}

export function validarFechaHora(fecha: unknown, hora: unknown): string | null {
  const error = validarFecha(fecha);
  if (error) return error;
  if (!esTexto(hora) || !HORARIOS.includes(hora)) return 'La hora no es un horario válido';
  if (fecha === hoy() && hora <= horaActual()) return 'El horario ya pasó';
  return null;
}

export function validarDni(dni: unknown): string | null {
  if (!esTexto(dni) || !REGEX_DNI.test(dni)) return 'El DNI debe tener 7 u 8 dígitos';
  return null;
}

export function validarCodigo(codigo: unknown): string | null {
  if (!esTexto(codigo) || !REGEX_CODIGO.test(codigo)) return 'El código debe tener formato T-XXXXX';
  return null;
}

function validarNombre(valor: unknown, campo: string): string | null {
  if (!esTexto(valor)) return `El ${campo} es obligatorio`;
  const texto = valor.trim();
  if (texto.length < 2 || texto.length > 60) return `El ${campo} debe tener entre 2 y 60 caracteres`;
  if (!REGEX_NOMBRE.test(texto)) return `El ${campo} solo puede tener letras y espacios`;
  return null;
}

export function validarNuevoTurno(body: any): string | null {
  return (
    validarNombre(body.nombre, 'nombre') ||
    validarNombre(body.apellido, 'apellido') ||
    validarDni(body.dni) ||
    (!esTexto(body.email) || !REGEX_EMAIL.test(body.email) || body.email.length > 120
      ? 'El email no tiene un formato válido'
      : null) ||
    (!esTexto(body.telefono) || !REGEX_TELEFONO.test(body.telefono)
      ? 'El teléfono debe tener entre 8 y 15 dígitos'
      : null) ||
    (body.obraSocial !== undefined && body.obraSocial !== null &&
      (!esTexto(body.obraSocial) || body.obraSocial.trim().length > 50)
      ? 'La obra social admite hasta 50 caracteres'
      : null) ||
    validarFechaHora(body.fecha, body.hora)
  );
}

export function validarEstado(estado: unknown): string | null {
  if (!esTexto(estado) || !ESTADOS.includes(estado)) return 'El estado no es válido';
  return null;
}

export function validarId(id: unknown): string | null {
  if (!esTexto(id) || !/^\d+$/.test(id)) return 'El id no es válido';
  return null;
}

export function validarLogin(body: any): string | null {
  if (!esTexto(body.email) || !REGEX_EMAIL.test(body.email)) return 'El email no tiene un formato válido';
  if (!esTexto(body.password) || body.password.length === 0) return 'La contraseña es obligatoria';
  return null;
}
