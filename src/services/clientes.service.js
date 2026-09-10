import { pool } from '../config/database.js';

import {
    initialsCode,
    normalizeOptional,
    required
} from '../utils/helpers.js';


function formatTimestampForCode() {
    const parts = new Intl.DateTimeFormat(
        'en-CA',
        {
            timeZone: 'America/Santiago',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }
    ).formatToParts(
        new Date()
    );

    const values = {};

    for (const part of parts) {
        if (part.type !== 'literal') {
            values[part.type] = part.value;
        }
    }

    return [
        values.year,
        values.month,
        values.day,
        values.hour,
        values.minute,
        values.second
    ].join('');
}


function validateTelefono(telefono) {
    const value = String(
        telefono || ''
    ).replace(
        /\D/g,
        ''
    );

    if (value.length !== 9) {
        throw new Error(
            'El teléfono debe contener 9 dígitos.'
        );
    }

    return value;
}


function validateGenero(genero) {
    const allowed = [
        'Masculino',
        'Femenino',
        'Prefiero no indicar'
    ];

    if (!allowed.includes(genero)) {
        throw new Error(
            'El género seleccionado no es válido.'
        );
    }

    return genero;
}


function validateEmail(email) {
    const value = String(
        email || ''
    ).trim();

    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(value)) {
        throw new Error(
            'El correo electrónico no es válido.'
        );
    }

    return value;
}


function normalizeRunSearch(value) {
    return String(
        value || ''
    )
        .replace(/\./g, '')
        .replace(/-/g, '')
        .replace(/\s/g, '')
        .toUpperCase();
}


export async function listClientes(q = '') {
    const termino =
        String(
            q || ''
        )
            .trim()
            .replace(
                /\s+/g,
                ' '
            );

    const terminoRun =
        normalizeRunSearch(
            termino
        );

    const like =
        `%${termino}%`;

    const likeRun =
        `%${terminoRun}%`;


    let sql = `
        SELECT
            c.id_cliente,
            c.codigo_cliente,
            c.nombre_cliente,
            c.primer_apellido_cliente,
            c.segundo_apellido_cliente,
            c.email_cliente,
            c.telefono_cliente,
            c.run_cliente,
            c.fecha_nacimiento_cliente,
            c.genero_cliente,
            c.direccion_cliente,
            c.fecha_alta_cliente,
            c.observaciones_cliente,
            c.activo_cliente,
            c.fecha_registro_cliente,
            c.fecha_actualizacion_cliente,

            CASE
                WHEN EXISTS (
                    SELECT
                        1

                    FROM suscripcion s

                    WHERE
                        s.det_cliente =
                            c.id_cliente

                        AND
                        s.estado_suscripcion
                            <> 'CANCELADA'

                        AND
                        CURDATE()
                            BETWEEN
                                s.fecha_inicio_suscripcion
                                AND
                                s.fecha_termino_suscripcion
                )
                THEN
                    'ACTIVO'

                ELSE
                    'INACTIVO'
            END AS estado_cliente

        FROM cliente c

        WHERE
            c.activo_cliente = 1
    `;


    const params = [];


    if (termino) {
        sql += `
            AND (
                c.codigo_cliente LIKE ?

                OR
                c.nombre_cliente LIKE ?

                OR
                c.primer_apellido_cliente LIKE ?

                OR
                c.segundo_apellido_cliente LIKE ?

                OR
                CONCAT_WS(
                    ' ',
                    c.nombre_cliente,
                    c.primer_apellido_cliente,
                    c.segundo_apellido_cliente
                ) LIKE ?

                OR
                c.email_cliente LIKE ?

                OR
                c.telefono_cliente LIKE ?

                OR
                c.run_cliente LIKE ?

                OR
                REPLACE(
                    REPLACE(
                        UPPER(
                            c.run_cliente
                        ),
                        '.',
                        ''
                    ),
                    '-',
                    ''
                ) LIKE ?
            )
        `;


        params.push(
            like,
            like,
            like,
            like,
            like,
            like,
            like,
            like,
            likeRun
        );
    }


    sql += `
        ORDER BY
            c.primer_apellido_cliente ASC,
            c.segundo_apellido_cliente ASC,
            c.nombre_cliente ASC
    `;


    const [
        rows
    ] = await pool.query(
        sql,
        params
    );


    return rows;
}


export async function getCliente(id) {
    const [
        rows
    ] = await pool.query(
        `
            SELECT
                c.id_cliente,
                c.codigo_cliente,
                c.nombre_cliente,
                c.primer_apellido_cliente,
                c.segundo_apellido_cliente,
                c.email_cliente,
                c.telefono_cliente,
                c.run_cliente,
                c.fecha_nacimiento_cliente,
                c.genero_cliente,
                c.direccion_cliente,
                c.fecha_alta_cliente,
                c.observaciones_cliente,
                c.activo_cliente,
                c.fecha_registro_cliente,
                c.fecha_actualizacion_cliente,

                CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM suscripcion s
                        WHERE
                            s.det_cliente =
                                c.id_cliente

                            AND
                            s.estado_suscripcion
                                <> 'CANCELADA'

                            AND
                            CURDATE()
                                BETWEEN
                                    s.fecha_inicio_suscripcion
                                    AND
                                    s.fecha_termino_suscripcion
                    )
                    THEN 'ACTIVO'
                    ELSE 'INACTIVO'
                END AS estado_cliente

            FROM cliente c

            WHERE
                c.id_cliente = ?
        `,
        [
            id
        ]
    );

    if (!rows.length) {
        throw new Error(
            'Cliente no encontrado.'
        );
    }

    return rows[0];
}


export async function createCliente(
    body
) {
    const nombreCliente =
        required(
            body.nombre_cliente,
            'El nombre es obligatorio.'
        );

    const primerApellidoCliente =
        required(
            body.primer_apellido_cliente,
            'El primer apellido es obligatorio.'
        );

    const segundoApellidoCliente =
        normalizeOptional(
            body.segundo_apellido_cliente
        );

    const emailCliente =
        validateEmail(
            required(
                body.email_cliente,
                'El correo electrónico es obligatorio.'
            )
        );

    const telefonoCliente =
        validateTelefono(
            required(
                body.telefono_cliente,
                'El teléfono es obligatorio.'
            )
        );

    const runCliente =
        required(
            body.run_cliente,
            'El RUN es obligatorio.'
        );

    const fechaNacimientoCliente =
        required(
            body.fecha_nacimiento_cliente,
            'La fecha de nacimiento es obligatoria.'
        );

    const generoCliente =
        validateGenero(
            required(
                body.genero_cliente,
                'El género es obligatorio.'
            )
        );

    const direccionCliente =
        required(
            body.direccion_cliente,
            'La dirección es obligatoria.'
        );

    const observacionesCliente =
        normalizeOptional(
            body.observaciones_cliente
        );

    const connection =
        await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [
            result
        ] = await connection.query(
            `
                INSERT INTO cliente (
                    nombre_cliente,
                    primer_apellido_cliente,
                    segundo_apellido_cliente,
                    email_cliente,
                    telefono_cliente,
                    run_cliente,
                    fecha_nacimiento_cliente,
                    genero_cliente,
                    direccion_cliente,
                    fecha_alta_cliente,
                    observaciones_cliente,
                    activo_cliente
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
                    ?,
                    CURDATE(),
                    ?,
                    1
                )
            `,
            [
                nombreCliente,
                primerApellidoCliente,
                segundoApellidoCliente,
                emailCliente,
                telefonoCliente,
                runCliente,
                fechaNacimientoCliente,
                generoCliente,
                direccionCliente,
                observacionesCliente
            ]
        );

        const idCliente =
            result.insertId;

        const codigoCliente =
            `${initialsCode(
                nombreCliente,
                primerApellidoCliente
            )}-${formatTimestampForCode()}-${idCliente}`;

        await connection.query(
            `
                UPDATE cliente
                SET
                    codigo_cliente = ?
                WHERE
                    id_cliente = ?
            `,
            [
                codigoCliente,
                idCliente
            ]
        );

        await connection.commit();

        return await getCliente(
            idCliente
        );
    } catch (error) {
        await connection.rollback();

        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {
            throw new Error(
                'Ya existe un cliente con ese RUN.'
            );
        }

        throw error;
    } finally {
        connection.release();
    }
}


export async function updateCliente(
    id,
    body
) {
    const nombreCliente =
        required(
            body.nombre_cliente,
            'El nombre es obligatorio.'
        );

    const primerApellidoCliente =
        required(
            body.primer_apellido_cliente,
            'El primer apellido es obligatorio.'
        );

    const segundoApellidoCliente =
        normalizeOptional(
            body.segundo_apellido_cliente
        );

    const emailCliente =
        validateEmail(
            required(
                body.email_cliente,
                'El correo electrónico es obligatorio.'
            )
        );

    const telefonoCliente =
        validateTelefono(
            required(
                body.telefono_cliente,
                'El teléfono es obligatorio.'
            )
        );

    const runCliente =
        required(
            body.run_cliente,
            'El RUN es obligatorio.'
        );

    const fechaNacimientoCliente =
        required(
            body.fecha_nacimiento_cliente,
            'La fecha de nacimiento es obligatoria.'
        );

    const generoCliente =
        validateGenero(
            required(
                body.genero_cliente,
                'El género es obligatorio.'
            )
        );

    const direccionCliente =
        required(
            body.direccion_cliente,
            'La dirección es obligatoria.'
        );

    const observacionesCliente =
        normalizeOptional(
            body.observaciones_cliente
        );

    try {
        const [
            result
        ] = await pool.query(
            `
                UPDATE cliente
                SET
                    nombre_cliente = ?,
                    primer_apellido_cliente = ?,
                    segundo_apellido_cliente = ?,
                    email_cliente = ?,
                    telefono_cliente = ?,
                    run_cliente = ?,
                    fecha_nacimiento_cliente = ?,
                    genero_cliente = ?,
                    direccion_cliente = ?,
                    observaciones_cliente = ?
                WHERE
                    id_cliente = ?
            `,
            [
                nombreCliente,
                primerApellidoCliente,
                segundoApellidoCliente,
                emailCliente,
                telefonoCliente,
                runCliente,
                fechaNacimientoCliente,
                generoCliente,
                direccionCliente,
                observacionesCliente,
                id
            ]
        );

        if (!result.affectedRows) {
            throw new Error(
                'Cliente no encontrado.'
            );
        }

        return await getCliente(
            id
        );
    } catch (error) {
        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {
            throw new Error(
                'Ya existe un cliente con ese RUN.'
            );
        }

        throw error;
    }
}