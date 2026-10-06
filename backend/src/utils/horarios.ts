// Los 16 turnos de 30 minutos: mañana 08:00-12:00 y tarde 16:00-20:00
export const HORARIOS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
];

// true si la fecha ('YYYY-MM-DD') cae de lunes a viernes
export function esDiaHabil(fecha: string): boolean {
  const dia = new Date(fecha + 'T00:00:00').getDay(); // 0 = domingo, 6 = sábado
  return dia >= 1 && dia <= 5;
}

function dosDigitos(n: number): string {
  return String(n).padStart(2, '0');
}

// Fecha local en formato 'YYYY-MM-DD'
export function formatoFecha(d: Date): string {
  return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;
}

export function hoy(): string {
  return formatoFecha(new Date());
}

// Hora local actual en formato 'HH:mm'
export function horaActual(): string {
  const d = new Date();
  return `${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}`;
}

// Horas que faltan desde ahora hasta la fecha y hora del turno
export function horasHasta(fecha: string, hora: string): number {
  const inicio = new Date(`${fecha}T${hora}:00`);
  return (inicio.getTime() - Date.now()) / (1000 * 60 * 60);
}
