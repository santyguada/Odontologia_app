import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { permitirRoles, verificarToken } from '../middlewares/auth';

const router = Router();

// Todas las rutas del panel requieren token
router.use(verificarToken);

router.get('/turnos', permitirRoles('admin', 'odontologo'), adminController.listar);
// El odontólogo entra, pero el service solo le permite pasar a "atendido"
router.patch('/turnos/:id/estado', permitirRoles('admin', 'odontologo'), adminController.cambiarEstado);
router.post('/turnos', permitirRoles('admin'), adminController.crear);
router.patch('/turnos/:id/reprogramar', permitirRoles('admin'), adminController.reprogramar);

export default router;
