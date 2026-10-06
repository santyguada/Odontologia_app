import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../db/connection';
import { LoginResponse, Usuario } from '../models';
import { HttpError } from '../utils/http-error';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const [filas] = await pool.query<RowDataPacket[]>(
    'SELECT id, nombre, rol, password_hash FROM usuarios WHERE email = ?',
    [email],
  );
  if (filas.length === 0) throw new HttpError(401, 'Credenciales incorrectas');

  const fila = filas[0];
  const coincide = await bcrypt.compare(password, fila.password_hash);
  if (!coincide) throw new HttpError(401, 'Credenciales incorrectas');

  const usuario: Usuario = { id: fila.id, nombre: fila.nombre, rol: fila.rol };
  const token = jwt.sign(usuario, process.env.JWT_SECRET as string, { expiresIn: '8h' });
  return { token, usuario };
}
