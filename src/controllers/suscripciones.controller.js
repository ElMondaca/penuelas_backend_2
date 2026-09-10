import * as service from '../services/suscripciones.service.js';


// ============================================================
// LISTAR SUSCRIPCIONES
// ============================================================

export async function list(_req, res) {
    const data =
        await service.listSuscripciones();

    res.json(
        data
    );
}


// ============================================================
// SUGERENCIA DE RENOVACIÓN
// ============================================================

export async function suggestion(req, res) {
    const idCliente =
        Number(
            req.params.idCliente
        );

    const fechaRenovacion =
        req.query.fecha_renovacion_suscripcion;

    const idPlan =
        req.query.det_plan
            ? Number(
                req.query.det_plan
            )
            : null;

    const data =
        await service.sugerenciaSuscripcion(
            idCliente,
            fechaRenovacion,
            idPlan
        );

    res.json(
        data
    );
}


// ============================================================
// CREAR SUSCRIPCIÓN / RENOVACIÓN
// ============================================================

export async function create(req, res) {
    const data =
        await service.createSuscripcion(
            req.body
        );

    res.status(
        201
    ).json(
        data
    );
}


// ============================================================
// CANCELAR SUSCRIPCIÓN
// ============================================================

export async function cancel(req, res) {
    const id =
        Number(
            req.params.id
        );

    const data =
        await service.cancelarSuscripcion(
            id
        );

    res.json(
        data
    );
}