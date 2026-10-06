import { Router } from 'express';
import * as turnosController from '../controllers/turnos.controller';

const router = Router();

router.get('/disponibles', turnosController.disponibles);
router.post('/', turnosController.crear);
router.get('/:codigo', turnosController.obtener);
router.patch('/:codigo/cancelar', turnosController.cancelar);
router.patch('/:codigo/reprogramar', turnosController.reprogramar);

export default router;
