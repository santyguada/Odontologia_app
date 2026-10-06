// Las fechas viajan como texto 'YYYY-MM-DD'. Se arman y leen a mano para no sufrir corrimientos de zona horaria.

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function dosDigitos(n: number): string {
  return String(n).padStart(2, '0');
}

export function hoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;
}

export function esDiaHabil(fecha: string): boolean {
  const dia = new Date(fecha + 'T00:00:00').getDay();
  return dia >= 1 && dia <= 5;
}

// '2026-10-08' -> 'jueves 08/10/2026'
export function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-');
  const nombreDia = DIAS[new Date(fecha + 'T00:00:00').getDay()];
  return `${nombreDia} ${dia}/${mes}/${anio}`;
}
