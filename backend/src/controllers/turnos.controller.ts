import { Request, Response } from 'express';
import * as turnosService from '../services/turnos.service';
import {
  validarCodigo, validarDni, validarFecha, validarFechaHora, validarNuevoTurno,
} from '../utils/validators';

// Express 5 envía al manejador de errores cualquier excepción de un controller async

export async function disponibles(req: Request, res: Response) {
  const error = validarFecha(req.query.fecha);
  if (error) return res.status(400).json({ error });
  res.json(await turnosService.obtenerDisponibles(req.query.fecha as string));
}

export async function crear(req: Request, res: Response) {
  const body = req.body ?? {};
  const error = validarNuevoTurno(body);
  if (error) return res.status(400).json({ error });
  res.status(201).json(await turnosService.crearTurno(body));
}

export async function obtener(req: Request, res: Response) {
  const error = validarCodigo(req.params.codigo) || validarDni(req.query.dni);
  if (error) return res.status(400).json({ error });
  res.json(await turnosService.obtenerPorCodigo(req.params.codigo as string, req.query.dni as string));
}

export async function cancelar(req: Request, res: Response) {
  const body = req.body ?? {};
  const error = validarCodigo(req.params.codigo) || validarDni(body.dni);
  if (error) return res.status(400).json({ error });
  res.json(await turnosService.cancelarPorPaciente(req.params.codigo as string, body.dni));
}

export async function reprogramar(req: Request, res: Response) {
  const body = req.body ?? {};
  const error = validarCodigo(req.params.codigo) || validarDni(body.dni) || validarFechaHora(body.fecha, body.hora);
  if (error) return res.status(400).json({ error });
  res.json(
    await turnosService.reprogramarPorPaciente(req.params.codigo as string, body.dni, body.fecha, body.hora),
  );
}
