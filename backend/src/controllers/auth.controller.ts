import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { validarLogin } from '../utils/validators';

export async function login(req: Request, res: Response) {
  const body = req.body ?? {};
  const error = validarLogin(body);
  if (error) return res.status(400).json({ error });
  res.json(await authService.login(body.email, body.password));
}
