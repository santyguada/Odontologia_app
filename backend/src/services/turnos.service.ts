import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../db/connection';
import { EstadoTurno, NuevoTurnoDto, Rol, Turno } from '../models';
import { HttpError } from '../utils/http-error';
import { HORARIOS, hoy, horaActual, horasHasta } from '../utils/horarios';

// Columnas del turno + paciente, ya en camelCase y con la hora como 'HH:mm'
const SELECT_TURNO = `
  SELECT t.id, t.codigo, t.fecha, DATE_FORMAT(t.hora, '%H:%i') AS hora, t.estado,
         p.id AS pacienteId, p.nombre, p.apellido, p.dni, p.email, p.telefono, p.obra_social AS obraSocial
  FROM turnos t
  JOIN pacientes p ON p.id = t.paciente_id`;

// Transiciones de estado permitidas (sección 4 de la especificación)
const TRANSICIONES: Record<EstadoTurno, EstadoTurno[]> = {
  pendiente: ['confirmado', 'cancelado'],
  confirmado: ['atendido', 'cancelado'],
  cancelado: [],
  atendido: [],
};

const CARACTERES_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generarCodigo(): string {
  let codigo = 'T-';
  for (let i = 0; i < 5; i++) {
    codigo += CARACTERES_CODIGO[Math.floor(Math.random() * CARACTERES_CODIGO.length)];
  }
  return codigo;
}

function filaATurno(fila: RowDataPacket): Turno {
  return {
    id: fila.id,
    codigo: fila.codigo,
    fecha: fila.fecha,
    hora: fila.hora,
    estado: fila.estado,
    paciente: {
      id: fila.pacienteId,
      nombre: fila.nombre,
      apellido: fila.apellido,
      dni: fila.dni,
      email: fila.email,
      telefono: fila.telefono,
      obraSocial: fila.obraSocial,
    },
  };
}

async function buscarPorId(id: number): Promise<Turno> {
  const [filas] = await pool.query<RowDataPacket[]>(`${SELECT_TURNO} WHERE t.id = ?`, [id]);
  if (filas.length === 0) throw new HttpError(404, 'Turno inexistente');
  return filaATurno(filas[0]);
}

// Ejecuta una función dentro de una transacción: commit si sale bien, rollback si falla
async function enTransaccion<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const resultado = await fn(conn);
    await conn.commit();
    return resultado;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Verifica que el horario esté libre y que el paciente no tenga otro turno activo ese día.
// FOR UPDATE bloquea esas filas hasta el commit para evitar dos reservas simultáneas del mismo horario.
async function verificarDisponibilidad(
  conn: PoolConnection, fecha: string, hora: string, pacienteId: number | null, excluirTurnoId: number,
): Promise<void> {
  const [ocupados] = await conn.query<RowDataPacket[]>(
    `SELECT id FROM turnos WHERE fecha = ? AND hora = ? AND estado <> 'cancelado' AND id <> ? FOR UPDATE`,
    [fecha, hora, excluirTurnoId],
  );
  if (ocupados.length > 0) throw new HttpError(409, 'El horario ya está ocupado');

  if (pacienteId !== null) {
    const [delDia] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM turnos WHERE paciente_id = ? AND fecha = ? AND estado <> 'cancelado' AND id <> ? FOR UPDATE`,
      [pacienteId, fecha, excluirTurnoId],
    );
    if (delDia.length > 0) throw new HttpError(409, 'El paciente ya tiene un turno activo ese día');
  }
}

export async function obtenerDisponibles(fecha: string): Promise<string[]> {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT DATE_FORMAT(hora, '%H:%i') AS hora FROM turnos WHERE fecha = ? AND estado <> 'cancelado'`,
    [fecha],
  );
  const ocupados = filas.map((f) => f.hora as string);
  const esHoy = fecha === hoy();
  const ahora = horaActual();
  return HORARIOS.filter((h) => !ocupados.includes(h) && (!esHoy || h > ahora));
}

export async function crearTurno(dto: NuevoTurnoDto): Promise<Turno> {
  const obraSocial = dto.obraSocial?.trim() || null;

  const id = await enTransaccion(async (conn) => {
    // Si el DNI ya existe se reutiliza el paciente y se actualizan sus datos de contacto
    const [pacientes] = await conn.query<RowDataPacket[]>(
      'SELECT id FROM pacientes WHERE dni = ? FOR UPDATE',
      [dto.dni],
    );
    let pacienteId: number | null = pacientes.length > 0 ? pacientes[0].id : null;

    await verificarDisponibilidad(conn, dto.fecha, dto.hora, pacienteId, 0);

    if (pacienteId !== null) {
      await conn.query(
        'UPDATE pacientes SET email = ?, telefono = ?, obra_social = ? WHERE id = ?',
        [dto.email, dto.telefono, obraSocial, pacienteId],
      );
    } else {
      const [res] = await conn.query<ResultSetHeader>(
        'INSERT INTO pacientes (nombre, apellido, dni, email, telefono, obra_social) VALUES (?, ?, ?, ?, ?, ?)',
        [dto.nombre.trim(), dto.apellido.trim(), dto.dni, dto.email, dto.telefono, obraSocial],
      );
      pacienteId = res.insertId;
    }

    // Código único: si ya existe, se genera otro
    let codigo = generarCodigo();
    let [repetidos] = await conn.query<RowDataPacket[]>('SELECT id FROM turnos WHERE codigo = ?', [codigo]);
    while (repetidos.length > 0) {
      codigo = generarCodigo();
      [repetidos] = await conn.query<RowDataPacket[]>('SELECT id FROM turnos WHERE codigo = ?', [codigo]);
    }

    const [res] = await conn.query<ResultSetHeader>(
      'INSERT INTO turnos (codigo, paciente_id, fecha, hora) VALUES (?, ?, ?, ?)',
      [codigo, pacienteId, dto.fecha, dto.hora],
    );
    return res.insertId;
  });

  return buscarPorId(id);
}

export async function obtenerPorCodigo(codigo: string, dni: string): Promise<Turno> {
  const [filas] = await pool.query<RowDataPacket[]>(
    `${SELECT_TURNO} WHERE t.codigo = ? AND p.dni = ?`,
    [codigo, dni],
  );
  if (filas.length === 0) throw new HttpError(404, 'No se encontró un turno con ese código y DNI');
  return filaATurno(filas[0]);
}

function verificarModificable(turno: Turno, aplicar24h: boolean): void {
  if (turno.estado !== 'pendiente' && turno.estado !== 'confirmado') {
    throw new HttpError(409, `No se puede modificar un turno ${turno.estado}`);
  }
  if (aplicar24h && horasHasta(turno.fecha, turno.hora) < 24) {
    throw new HttpError(422, 'Solo se puede cancelar o reprogramar hasta 24 h antes del turno');
  }
}

export async function cancelarPorPaciente(codigo: string, dni: string): Promise<Turno> {
  const turno = await obtenerPorCodigo(codigo, dni);
  verificarModificable(turno, true);
  await pool.query(`UPDATE turnos SET estado = 'cancelado' WHERE id = ?`, [turno.id]);
  return buscarPorId(turno.id);
}

async function reprogramar(turno: Turno, fecha: string, hora: string, aplicar24h: boolean): Promise<Turno> {
  verificarModificable(turno, aplicar24h);
  await enTransaccion(async (conn) => {
    await verificarDisponibilidad(conn, fecha, hora, turno.paciente.id, turno.id);
    await conn.query(
      `UPDATE turnos SET fecha = ?, hora = ?, estado = 'pendiente' WHERE id = ?`,
      [fecha, hora, turno.id],
    );
  });
  return buscarPorId(turno.id);
}

export async function reprogramarPorPaciente(codigo: string, dni: string, fecha: string, hora: string): Promise<Turno> {
  const turno = await obtenerPorCodigo(codigo, dni);
  return reprogramar(turno, fecha, hora, true);
}

// ---------- Panel ----------

export async function listarPorFecha(fecha: string): Promise<Turno[]> {
  const [filas] = await pool.query<RowDataPacket[]>(`${SELECT_TURNO} WHERE t.fecha = ? ORDER BY t.hora`, [fecha]);
  return filas.map(filaATurno);
}

export async function cambiarEstado(id: number, estado: EstadoTurno, rol: Rol): Promise<Turno> {
  if (rol === 'odontologo' && estado !== 'atendido') {
    throw new HttpError(403, 'El odontólogo solo puede marcar turnos como atendidos');
  }
  const turno = await buscarPorId(id);
  if (!TRANSICIONES[turno.estado].includes(estado)) {
    throw new HttpError(409, `No se puede pasar de ${turno.estado} a ${estado}`);
  }
  await pool.query('UPDATE turnos SET estado = ? WHERE id = ?', [estado, id]);
  return buscarPorId(id);
}

export async function reprogramarPorAdmin(id: number, fecha: string, hora: string): Promise<Turno> {
  const turno = await buscarPorId(id);
  return reprogramar(turno, fecha, hora, false);
}
