import { pool } from '../config/database.js';


// ============================================================
// DASHBOARD GENERAL
// ============================================================

export async function getDashboard() {

    // ========================================================
    // CLIENTES ACTIVOS
    // ========================================================

    const [
        [
            activeClients
        ]
    ] = await pool.query(
        `
            SELECT
                COUNT(
                    DISTINCT s.det_cliente
                ) AS total

            FROM suscripcion s

            WHERE
                s.estado_suscripcion
                    <> 'CANCELADA'

                AND
                CURDATE()
                    BETWEEN
                        s.fecha_inicio_suscripcion
                        AND
                        s.fecha_termino_suscripcion
        `
    );


    // ========================================================
    // SUSCRIPCIONES ACTIVAS
    // ========================================================

    const [
        [
            activeSubs
        ]
    ] = await pool.query(
        `
            SELECT
                COUNT(*) AS total

            FROM suscripcion

            WHERE
                estado_suscripcion
                    <> 'CANCELADA'

                AND
                CURDATE()
                    BETWEEN
                        fecha_inicio_suscripcion
                        AND
                        fecha_termino_suscripcion
        `
    );


    // ========================================================
    // SUSCRIPCIONES VENCIDAS
    // ========================================================

    const [
        [
            expiredSubs
        ]
    ] = await pool.query(
        `
            SELECT
                COUNT(*) AS total

            FROM suscripcion

            WHERE
                estado_suscripcion
                    <> 'CANCELADA'

                AND
                fecha_termino_suscripcion
                    < CURDATE()
        `
    );


    // ========================================================
    // INGRESOS DEL MES
    // ========================================================

    const [
        [
            monthlyIncome
        ]
    ] = await pool.query(
        `
            SELECT
                COALESCE(
                    SUM(
                        pa.monto_pago
                    ),
                    0
                ) AS total

            FROM pago pa

            INNER JOIN suscripcion s
                ON
                    s.id_suscripcion =
                    pa.det_suscripcion

            WHERE
                DATE_FORMAT(
                    pa.fecha_pago,
                    '%Y-%m'
                ) =
                DATE_FORMAT(
                    CURDATE(),
                    '%Y-%m'
                )

                AND
                s.estado_suscripcion
                    <> 'CANCELADA'
        `
    );


    return {
        clientes_activos:
            Number(
                activeClients.total
            ),

        suscripciones_activas:
            Number(
                activeSubs.total
            ),

        suscripciones_vencidas:
            Number(
                expiredSubs.total
            ),

        ingresos_mes:
            Number(
                monthlyIncome.total
            )
    };
}


// ============================================================
// DETALLE SUSCRIPCIONES ACTIVAS
// ============================================================

export async function getSuscripcionesActivas() {

    const [
        rows
    ] = await pool.query(
        `
            SELECT
                s.id_suscripcion,
                s.det_cliente,
                s.det_plan,

                s.fecha_inicio_suscripcion,
                s.fecha_termino_suscripcion,
                s.valor_final_suscripcion,

                c.codigo_cliente,
                c.run_cliente,
                c.nombre_cliente,
                c.primer_apellido_cliente,
                c.segundo_apellido_cliente,

                p.nombre_plan

            FROM suscripcion s

            INNER JOIN cliente c
                ON
                    c.id_cliente =
                    s.det_cliente

            INNER JOIN plan p
                ON
                    p.id_plan =
                    s.det_plan

            WHERE
                s.estado_suscripcion
                    <> 'CANCELADA'

                AND
                CURDATE()
                    BETWEEN
                        s.fecha_inicio_suscripcion
                        AND
                        s.fecha_termino_suscripcion

            ORDER BY
                s.fecha_termino_suscripcion ASC,
                c.primer_apellido_cliente ASC,
                c.nombre_cliente ASC
        `
    );


    return rows;
}


// ============================================================
// DETALLE SUSCRIPCIONES VENCIDAS
// ============================================================

export async function getSuscripcionesVencidas() {

    const [
        rows
    ] = await pool.query(
        `
            SELECT
                s.id_suscripcion,
                s.det_cliente,
                s.det_plan,

                s.fecha_inicio_suscripcion,
                s.fecha_termino_suscripcion,
                s.valor_final_suscripcion,

                c.codigo_cliente,
                c.run_cliente,
                c.nombre_cliente,
                c.primer_apellido_cliente,
                c.segundo_apellido_cliente,

                p.nombre_plan

            FROM suscripcion s

            INNER JOIN cliente c
                ON
                    c.id_cliente =
                    s.det_cliente

            INNER JOIN plan p
                ON
                    p.id_plan =
                    s.det_plan

            WHERE
                s.estado_suscripcion
                    <> 'CANCELADA'

                AND
                s.fecha_termino_suscripcion
                    < CURDATE()

            ORDER BY
                s.fecha_termino_suscripcion DESC,
                c.primer_apellido_cliente ASC,
                c.nombre_cliente ASC
        `
    );


    return rows;
}


// ============================================================
// DETALLE INGRESOS DEL MES
// ============================================================

export async function getIngresosMes() {

    const [
        rows
    ] = await pool.query(
        `
            SELECT
                pa.id_pago,
                pa.det_suscripcion,
                pa.fecha_pago,
                pa.monto_pago,
                pa.metodo_pago,

                s.id_suscripcion,
                s.det_cliente,
                s.det_plan,
                s.fecha_inicio_suscripcion,
                s.fecha_termino_suscripcion,
                s.estado_suscripcion,

                c.codigo_cliente,
                c.run_cliente,
                c.nombre_cliente,
                c.primer_apellido_cliente,
                c.segundo_apellido_cliente,

                p.nombre_plan,

                CASE
                    WHEN
                        s.estado_suscripcion =
                            'CANCELADA'
                    THEN
                        'CANCELADA'

                    WHEN
                        s.fecha_inicio_suscripcion >
                            CURDATE()
                    THEN
                        'PROGRAMADA'

                    WHEN
                        s.fecha_termino_suscripcion <
                            CURDATE()
                    THEN
                        'VENCIDA'

                    ELSE
                        'ACTIVA'
                END AS estado_calculado_suscripcion

            FROM pago pa

            INNER JOIN suscripcion s
                ON
                    s.id_suscripcion =
                    pa.det_suscripcion

            INNER JOIN cliente c
                ON
                    c.id_cliente =
                    s.det_cliente

            INNER JOIN plan p
                ON
                    p.id_plan =
                    s.det_plan

            WHERE
                DATE_FORMAT(
                    pa.fecha_pago,
                    '%Y-%m'
                ) =
                DATE_FORMAT(
                    CURDATE(),
                    '%Y-%m'
                )

                AND
                s.estado_suscripcion
                    <> 'CANCELADA'

            ORDER BY
                pa.fecha_pago DESC,
                pa.id_pago DESC
        `
    );


    return rows;
}