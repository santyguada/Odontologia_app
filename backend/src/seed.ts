import bcrypt from 'bcrypt';
import { ResultSetHeader } from 'mysql2/promise';
import { pool } from './db/connection';
import { EstadoTurno } from './models';
import { generarCodigo } from './services/turnos.service';
import { HORARIOS, esDiaHabil, formatoFecha, hoy, horaActual, horasHasta } from './utils/horarios';

const USUARIOS = [
  { nombre: 'Recepción', email: 'admin@consultorio.com', password: 'Admin123', rol: 'admin' },
  { nombre: 'Dr. Martín Suárez', email: 'odontologo@consultorio.com', password: 'Odonto123', rol: 'odontologo' },
];

// [nombre, apellido, dni, email, telefono, obraSocial]
const PACIENTES: [string, string, string, string, string, string | null][] = [
  ['Lucía', 'Gómez', '40123456', 'lucia.gomez@mail.com', '3462111111', 'OSDE'],
  ['Matías', 'Fernández', '38987654', 'matias.f@mail.com', '3462222222', null],
  ['Sofía', 'Ramírez', '42555666', 'sofi.ramirez@mail.com', '3462333333', 'Swiss Medical'],
  ['Juan', 'Pérez', '35111222', 'juanperez@mail.com', '3462444444', 'IOMA'],
  ['Valentina', 'López', '43777888', 'vale.lopez@mail.com', '3462555555', null],
  ['Nicolás', 'Torres', '39444555', 'ntorres@mail.com', '3462666666', 'PAMI'],
  ['Camila', 'Díaz', '41222333', 'camila.diaz@mail.com', '3462777777', 'OSDE'],
  ['Tomás', 'Ruiz', '37666999', 'tomas.ruiz@mail.com', '3462888888', null],
];

// Próximos 5 días hábiles a partir de mañana
function proximosDiasHabiles(): string[] {
  const dias: string[] = [];
  const d = new Date();
  while (dias.length < 5) {
    d.setDate(d.getDate() + 1);
    const fecha = formatoFecha(d);
    if (esDiaHabil(fecha)) dias.push(fecha);
  }
  return dias;
}

// Primer horario hábil posterior a ahora (sirve para probar el error 422 de las 24 h)
function proximoHorario(): { fecha: string; hora: string } {
  const d = new Date();
  for (;;) {
    const fecha = formatoFecha(d);
    if (esDiaHabil(fecha)) {
      const hora = HORARIOS.find((h) => fecha !== hoy() || h > horaActual());
      if (hora) return { fecha, hora };
    }
    d.setDate(d.getDate() + 1);
  }
}

async function main() {
  console.log('Vaciando tablas...');
  await pool.query('DELETE FROM turnos');
  await pool.query('DELETE FROM pacientes');
  await pool.query('DELETE FROM usuarios');
  await pool.query('ALTER TABLE turnos AUTO_INCREMENT = 1');
  await pool.query('ALTER TABLE pacientes AUTO_INCREMENT = 1');
  await pool.query('ALTER TABLE usuarios AUTO_INCREMENT = 1');

  for (const u of USUARIOS) {
    const hash = await bcrypt.hash(u.password, 10);
    await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
      [u.nombre, u.email, hash, u.rol],
    );
  }

  const pacienteIds: number[] = [];
  for (const p of PACIENTES) {
    const [res] = await pool.query<ResultSetHeader>(
      'INSERT INTO pacientes (nombre, apellido, dni, email, telefono, obra_social) VALUES (?, ?, ?, ?, ?, ?)',
      p,
    );
    pacienteIds.push(res.insertId);
  }

  const d = proximosDiasHabiles();
  const cerca = proximoHorario();
  // [índice de paciente, fecha, hora, estado]. Ningún otro turno usa las 08:00 ni el día de "cerca" para Lucía.
  const turnos: [number, string, string, EstadoTurno][] = [
    [0, cerca.fecha, cerca.hora, 'confirmado'],
    [1, d[0], '09:00', 'pendiente'],
    [2, d[0], '10:30', 'confirmado'],
    [3, d[0], '16:30', 'cancelado'],
    [4, d[1], '09:30', 'pendiente'],
    [5, d[1], '11:00', 'confirmado'],
    [6, d[1], '17:00', 'atendido'],
    [7, d[2], '08:30', 'pendiente'],
    [0, d[2], '18:00', 'pendiente'],
    [1, d[3], '10:00', 'confirmado'],
    [2, d[3], '19:00', 'pendiente'],
    [3, d[4], '11:30', 'pendiente'],
  ];

  const codigos = new Set<string>();
  console.log('\nTurnos creados (para probar /mi-turno):');
  for (const [i, fecha, hora, estado] of turnos) {
    let codigo = generarCodigo();
    while (codigos.has(codigo)) codigo = generarCodigo();
    codigos.add(codigo);

    await pool.query(
      'INSERT INTO turnos (codigo, paciente_id, fecha, hora, estado) VALUES (?, ?, ?, ?, ?)',
      [codigo, pacienteIds[i], fecha, hora, estado],
    );
    const [nombre, apellido, dni] = PACIENTES[i];
    console.log(`  ${codigo}  DNI ${dni}  ${fecha} ${hora}  ${estado.padEnd(10)}  ${nombre} ${apellido}`);
  }

  const horas = horasHasta(cerca.fecha, cerca.hora);
  console.log(`\nTurno a menos de 24 h (prueba del 422): ${cerca.fecha} ${cerca.hora}, DNI ${PACIENTES[0][2]}`);
  if (horas >= 24) {
    console.log('  Aviso: hoy es fin de semana, ese turno queda a más de 24 h.');
  }

  console.log('\nUsuarios: admin@consultorio.com / Admin123  -  odontologo@consultorio.com / Odonto123');
  await pool.end();
}

main().catch(async (err) => {
  console.error('Error en el seed:', err.message);
  await pool.end();
  process.exit(1);
});
