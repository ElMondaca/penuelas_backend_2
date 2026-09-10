import { Router } from 'express';

import * as controller from '../controllers/dashboard.controller.js';


const router = Router();


// ============================================================
// RESUMEN GENERAL
// ============================================================

router.get(
    '/',
    controller.get
);


// ============================================================
// DETALLE SUSCRIPCIONES ACTIVAS
// ============================================================

router.get(
    '/suscripciones-activas',
    controller.activeSubscriptions
);


// ============================================================
// DETALLE SUSCRIPCIONES VENCIDAS
// ============================================================

router.get(
    '/suscripciones-vencidas',
    controller.expiredSubscriptions
);


// ============================================================
// DETALLE INGRESOS DEL MES
// ============================================================

router.get(
    '/ingresos-mes',
    controller.monthlyIncome
);


export default router;