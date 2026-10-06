import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import turnosRoutes from './routes/turnos.routes';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import { HttpError } from './utils/http-error';

dotenv.config({ quiet: true });

const app = express();

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

app.use('/api/turnos', turnosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta inexistente' });
});

// Manejador de errores global
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'El cuerpo no es un JSON válido' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno' });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}/api`);
});
