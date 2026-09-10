import { pool } from '../config/database.js';


// ============================================================
// HELPERS
// ============================================================

function normalizeOptional(value) {
    const text =
        String(
            value ?? ''
        ).trim();

    return text || null;
}


function required(
    value,
    message
) {
    const text =
        String(
            value ?? ''
        ).trim();

    if (!text) {
        throw new Error(
            message
        );
    }

    return text;
}


function validarMetodoPago(
    metodo
) {
    const allowed = [
        'EFECTIVO',
        'TRANSFERENCIA',
        'DEBITO',
        'CREDITO'
    ];

    if (
        !allowed.includes(
            metodo
        )
    ) {
        throw new Error(
            'El método de pago no es válido.'
        );
    }

    return metodo;
}


// ============================================================
// MANEJO DE FECHAS
// ============================================================

function parseDate(
    value
) {
    const [
        year,
        month,
        day
    ] = String(
        value
    )
        .split('-')
        .map(Number);

    return new Date(
        Date.UTC(
            year,
            month - 1,
            day
        )
    );
}


function formatDate(
    date
) {
    return date
        .toISOString()
        .slice(
            0,
            10
        );
}


function addDays(
    dateString,
    days
) {
    const date =
        parseDate(
            dateString
        );

    date.setUTCDate(
        date.getUTCDate() +
        days
    );

    return formatDate(
        date
    );
}


function addMonthsClamped(
    dateString,
    months
) {
    const original =
        parseDate(
            dateString
        );

    const originalDay =
        original.getUTCDate();

    const result =
        new Date(
            original.getTime()
        );

    result.setUTCDate(
        1
    );

    result.setUTCMonth(
        result.getUTCMonth() +
        months
    );

    const lastDay =
        new Date(
            Date.UTC(
                result.getUTCFullYear(),
                result.getUTCMonth() + 1,
                0
            )
        ).getUTCDate();

    result.setUTCDate(
        Math.min(
            originalDay,
            lastDay
        )
    );

    return formatDate(
        result
    );
}


// ============================================================
// CALCULAR FECHA TÉRMINO
// ============================================================

function calcularFechaTermino(
    fechaInicio,
    duracion,
    unidad
) {
    const cantidad =
        Number(
            duracion
        );

    if (
        !cantidad ||
        cantidad <= 0
    ) {
        throw new Error(
            'La duración del plan no es válida.'
        );
    }

    let fechaLimite;

    if (
        unidad === 'DIAS'
    ) {
        fechaLimite =
            addDays(
                fechaInicio,
                cantidad
            );
    } else if (
        unidad === 'MESES'
    ) {
        fechaLimite =
            addMonthsClamped(
                fechaInicio,
                cantidad
            );
    } else {
        throw new Error(
            'La unidad de duración del plan no es válida.'
        );
    }

    /*
     * El período es inclusivo.
     *
     * Ejemplo:
     *
     * inicio = 2026-09-09
     * 1 mes
     *
     * fecha límite = 2026-10-09
     * término      = 2026-10-08
     */
    return addDays(
        fechaLimite,
        -1
    );
}


// ============================================================
// LISTADO
// ============================================================

export async function listSuscripciones() {
    const [
        rows
    ] = await pool.query(
        `
            SELECT
                s.id_suscripcion,
                s.det_cliente,
                s.det_plan,

                s.fecha_renovacion_suscripcion,
                s.fecha_inicio_suscripcion,
                s.fecha_termino_suscripcion,

                s.valor_plan_suscripcion,
                s.descuento_suscripcion,
                s.valor_final_suscripcion,

                s.estado_suscripcion,
                s.observacion_suscripcion,
                s.fecha_registro_suscripcion,

                c.codigo_cliente,
                c.run_cliente,
                c.nombre_cliente,
                c.primer_apellido_cliente,
                c.segundo_apellido_cliente,

                p.nombre_plan,

                pa.metodo_pago,

                CASE
                    WHEN
                        s.estado_suscripcion = 'CANCELADA'
                    THEN
                        'CANCELADA'

                    WHEN
                        s.fecha_inicio_suscripcion > CURDATE()
                    THEN
                        'PROGRAMADA'

                    WHEN
                        s.fecha_termino_suscripcion < CURDATE()
                    THEN
                        'VENCIDA'

                    ELSE
                        'ACTIVA'
                END AS estado_calculado_suscripcion

            FROM suscripcion s

            INNER JOIN cliente c
                ON
                    c.id_cliente =
                    s.det_cliente

            INNER JOIN plan p
                ON
                    p.id_plan =
                    s.det_plan

            LEFT JOIN pago pa
                ON
                    pa.det_suscripcion =
                    s.id_suscripcion

            ORDER BY
                s.fecha_renovacion_suscripcion DESC,
                s.id_suscripcion DESC
        `
    );

    return rows;
}


// ============================================================
// SUGERENCIA RENOVACIÓN
// ============================================================

export async function sugerenciaSuscripcion(
    idCliente,
    fechaRenovacion,
    idPlan = null
) {
    const clienteId =
        Number(
            idCliente
        );

    if (
        !clienteId
    ) {
        throw new Error(
            'El cliente no es válido.'
        );
    }

    const fechaRenovacionValue =
        required(
            fechaRenovacion,
            'La fecha de renovación es obligatoria.'
        );


    const [
        clienteRows
    ] = await pool.query(
        `
            SELECT
                id_cliente
            FROM cliente
            WHERE
                id_cliente = ?
        `,
        [
            clienteId
        ]
    );

    if (
        !clienteRows.length
    ) {
        throw new Error(
            'Cliente no encontrado.'
        );
    }


    const [
        ultimaRows
    ] = await pool.query(
        `
            SELECT
                fecha_termino_suscripcion

            FROM suscripcion

            WHERE
                det_cliente = ?

                AND
                estado_suscripcion <> 'CANCELADA'

            ORDER BY
                fecha_termino_suscripcion DESC,
                id_suscripcion DESC

            LIMIT 1
        `,
        [
            clienteId
        ]
    );


    let fechaInicio =
        fechaRenovacionValue;


    if (
        ultimaRows.length
    ) {
        const diaSiguiente =
            addDays(
                ultimaRows[0].fecha_termino_suscripcion,
                1
            );

        if (
            diaSiguiente >
            fechaRenovacionValue
        ) {
            fechaInicio =
                diaSiguiente;
        }
    }


    let fechaTermino =
        null;


    if (
        idPlan
    ) {
        const [
            planRows
        ] = await pool.query(
            `
                SELECT
                    id_plan,
                    duracion_plan,
                    unidad_duracion_plan

                FROM plan

                WHERE
                    id_plan = ?
                    AND
                    activo_plan = 1
            `,
            [
                idPlan
            ]
        );


        if (
            !planRows.length
        ) {
            throw new Error(
                'Plan no encontrado o inactivo.'
            );
        }


        const plan =
            planRows[0];


        fechaTermino =
            calcularFechaTermino(
                fechaInicio,
                plan.duracion_plan,
                plan.unidad_duracion_plan
            );
    }


    return {
        fecha_renovacion_suscripcion:
            fechaRenovacionValue,

        fecha_inicio_suscripcion:
            fechaInicio,

        fecha_termino_suscripcion:
            fechaTermino
    };
}


// ============================================================
// CREAR SUSCRIPCIÓN / RENOVACIÓN
// ============================================================

export async function createSuscripcion(
    body
) {
    const detCliente =
        Number(
            required(
                body.det_cliente,
                'El cliente es obligatorio.'
            )
        );


    const detPlan =
        Number(
            required(
                body.det_plan,
                'El plan es obligatorio.'
            )
        );


    const fechaRenovacion =
        required(
            body.fecha_renovacion_suscripcion,
            'La fecha de renovación es obligatoria.'
        );


    const fechaInicio =
        required(
            body.fecha_inicio_suscripcion,
            'La fecha de inicio es obligatoria.'
        );


    const metodoPago =
        validarMetodoPago(
            required(
                body.metodo_pago,
                'El método de pago es obligatorio.'
            )
        );


    const observacion =
        normalizeOptional(
            body.observacion_suscripcion
        );


    const connection =
        await pool.getConnection();


    try {
        await connection.beginTransaction();


        // ====================================================
        // CLIENTE
        // ====================================================

        const [
            clientes
        ] = await connection.query(
            `
                SELECT
                    id_cliente

                FROM cliente

                WHERE
                    id_cliente = ?
            `,
            [
                detCliente
            ]
        );


        if (
            !clientes.length
        ) {
            throw new Error(
                'Cliente no encontrado.'
            );
        }


        // ====================================================
        // PLAN
        // ====================================================

        const [
            planes
        ] = await connection.query(
            `
                SELECT
                    id_plan,
                    nombre_plan,
                    valor_plan,
                    descuento_plan,
                    duracion_plan,
                    unidad_duracion_plan,
                    activo_plan

                FROM plan

                WHERE
                    id_plan = ?
                    AND
                    activo_plan = 1
            `,
            [
                detPlan
            ]
        );


        if (
            !planes.length
        ) {
            throw new Error(
                'Plan no encontrado o inactivo.'
            );
        }


        const plan =
            planes[0];


        // ====================================================
        // FECHA TÉRMINO
        // ====================================================

        /*
         * No confiamos en la fecha enviada por frontend.
         *
         * El backend vuelve a calcularla usando
         * duración + unidad del plan.
         */
        const fechaTermino =
            calcularFechaTermino(
                fechaInicio,
                plan.duracion_plan,
                plan.unidad_duracion_plan
            );


        // ====================================================
        // VALIDAR SOLAPAMIENTO
        // ====================================================

        const [
            solapamientos
        ] = await connection.query(
            `
                SELECT
                    id_suscripcion

                FROM suscripcion

                WHERE
                    det_cliente = ?

                    AND
                    estado_suscripcion <> 'CANCELADA'

                    AND
                    fecha_inicio_suscripcion <= ?

                    AND
                    fecha_termino_suscripcion >= ?

                LIMIT 1
            `,
            [
                detCliente,
                fechaTermino,
                fechaInicio
            ]
        );


        if (
            solapamientos.length
        ) {
            throw new Error(
                'La fecha de inicio no puede estar dentro del período de una suscripción anterior.'
            );
        }


        // ====================================================
        // VALORES DEL PLAN
        // ====================================================

        const valorPlan =
            Number(
                plan.valor_plan
            );


        const descuento =
            Number(
                plan.descuento_plan || 0
            );


        const valorFinal =
            Math.max(
                0,
                valorPlan -
                descuento
            );


        // ====================================================
        // INSERT SUSCRIPCIÓN
        // ====================================================

        const [
            result
        ] = await connection.query(
            `
                INSERT INTO suscripcion (
                    det_cliente,
                    det_plan,

                    fecha_renovacion_suscripcion,
                    fecha_inicio_suscripcion,
                    fecha_termino_suscripcion,

                    valor_plan_suscripcion,
                    descuento_suscripcion,
                    valor_final_suscripcion,

                    estado_suscripcion,
                    observacion_suscripcion
                )
                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    'ACTIVA',
                    ?
                )
            `,
            [
                detCliente,
                detPlan,

                fechaRenovacion,
                fechaInicio,
                fechaTermino,

                valorPlan,
                descuento,
                valorFinal,

                observacion
            ]
        );


        const idSuscripcion =
            result.insertId;


        // ====================================================
        // PAGO AUTOMÁTICO
        // ====================================================

        await connection.query(
            `
                INSERT INTO pago (
                    det_suscripcion,
                    monto_pago,
                    metodo_pago,
                    fecha_pago,
                    observacion_pago
                )
                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    NULL
                )
            `,
            [
                idSuscripcion,
                valorFinal,
                metodoPago,
                fechaRenovacion
            ]
        );


        await connection.commit();


        return {
            id_suscripcion:
                idSuscripcion,

            det_cliente:
                detCliente,

            det_plan:
                detPlan,

            fecha_renovacion_suscripcion:
                fechaRenovacion,

            fecha_inicio_suscripcion:
                fechaInicio,

            fecha_termino_suscripcion:
                fechaTermino,

            valor_plan_suscripcion:
                valorPlan,

            descuento_suscripcion:
                descuento,

            valor_final_suscripcion:
                valorFinal,

            metodo_pago:
                metodoPago
        };
    } catch (error) {
        await connection.rollback();

        throw error;
    } finally {
        connection.release();
    }
}


// ============================================================
// CANCELAR SUSCRIPCIÓN
// ============================================================

export async function cancelarSuscripcion(
    id
) {
    const [
        result
    ] = await pool.query(
        `
            UPDATE suscripcion

            SET
                estado_suscripcion =
                    'CANCELADA'

            WHERE
                id_suscripcion = ?
        `,
        [
            id
        ]
    );


    if (
        !result.affectedRows
    ) {
        throw new Error(
            'Suscripción no encontrada.'
        );
    }


    return {
        ok: true
    };
}