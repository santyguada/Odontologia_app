// Error con código HTTP. Lo lanzan los services y lo convierte en respuesta el manejador global (index.ts)
export class HttpError extends Error {
  status: number;

  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.status = status;
  }
}
