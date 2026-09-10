import { Router } from 'express';
import * as controller from '../controllers/clientes.controller.js';

const router = Router();
router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
export default router;
