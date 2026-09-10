import { Router } from 'express';
import * as controller from '../controllers/suscripciones.controller.js';

const router = Router();
router.get('/', controller.list);
router.get('/sugerencia/:idCliente', controller.suggestion);
router.post('/', controller.create);
router.patch('/:id/cancelar', controller.cancel);
export default router;
