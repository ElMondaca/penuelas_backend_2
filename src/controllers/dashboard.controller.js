import * as service from '../services/dashboard.service.js';


// ============================================================
// RESUMEN GENERAL
// ============================================================

export async function get(_req, res) {
    const data =
        await service.getDashboard();

    res.json(
        data
    );
}


// ============================================================
// SUSCRIPCIONES ACTIVAS
// ============================================================

export async function activeSubscriptions(_req, res) {
    const data =
        await service.getSuscripcionesActivas();

    res.json(
        data
    );
}


// ============================================================
// SUSCRIPCIONES VENCIDAS
// ============================================================

export async function expiredSubscriptions(_req, res) {
    const data =
        await service.getSuscripcionesVencidas();

    res.json(
        data
    );
}


// ============================================================
// INGRESOS DEL MES
// ============================================================

export async function monthlyIncome(_req, res) {
    const data =
        await service.getIngresosMes();

    res.json(
        data
    );
}