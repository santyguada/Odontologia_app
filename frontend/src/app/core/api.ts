import { HttpErrorResponse } from '@angular/common/http';

export const API_URL = 'http://localhost:3000/api';

// Mensaje para mostrar debajo del formulario a partir de un error del backend ({ error: "mensaje" })
export function mensajeError(err: HttpErrorResponse): string {
  if (err.status === 0) return 'No se pudo conectar con el servidor';
  return err.error?.error ?? 'Ocurrió un error inesperado';
}
