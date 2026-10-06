import { Request, Response } from 'express';
import * as turnosService from '../services/turnos.service';
import {
  validarEstado, validarFechaHora, validarFormatoFecha, validarId, validarNuevoTurno,
} from '../utils/validators';

export async function listar(req: Request, res: Response) {
  // El panel puede consultar cualquier fecha (también pasadas o fines de semana)
  const error = validarFormatoFecha(req.query.fecha);
  if (error) return res.status(400).json({ error });
  res.json(await turnosService.listarPorFecha(req.query.fecha as string));
}

export async function cambiarEstado(req: Request, res: Response) {
  const body = req.body ?? {};
  const error = validarId(req.params.id) || validarEstado(body.estado);
  if (error) return res.status(400).json({ error });
  res.json(await turnosService.cambiarEstado(Number(req.params.id), body.estado, res.locals.usuario.rol));
}

export async function crear(req: Request, res: Response) {
  const body = req.body ?? {};
  const error = validarNuevoTurno(body);
  if (error) return res.status(400).json({ error });
  res.status(201).json(await turnosService.crearTurno(body));
}

export async function reprogramar(req: Request, res: Response) {
  const body = req.body ?? {};
  const error = validarId(req.params.id) || validarFechaHora(body.fecha, body.hora);
  if (error) return res.status(400).json({ error });
  res.json(await turnosService.reprogramarPorAdmin(Number(req.params.id), body.fecha, body.hora));
}
