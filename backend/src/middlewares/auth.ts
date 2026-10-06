import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Rol, Usuario } from '../models';

// Verifica el header "Authorization: Bearer <token>" y guarda el usuario en res.locals.usuario
export function verificarToken(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Falta el token' });
    return;
  }
  try {
    const datos = jwt.verify(header.slice(7), process.env.JWT_SECRET as string) as Usuario;
    res.locals.usuario = { id: datos.id, nombre: datos.nombre, rol: datos.rol };
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o vencido' });
  }
}

// Deja pasar solo a los roles indicados
export function permitirRoles(...roles: Rol[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const usuario = res.locals.usuario as Usuario;
    if (!roles.includes(usuario.rol)) {
      res.status(403).json({ error: 'No tenés permiso para esta acción' });
      return;
    }
    next();
  };
}
