import { pool } from '../config/database.js';

export async function listPagos() {
  const [rows] = await pool.query(`
    SELECT pa.*, s.estado_suscripcion, c.codigo_cliente, c.run_cliente,
      c.nombre_cliente, c.primer_apellido_cliente, c.segundo_apellido_cliente,
      p.nombre_plan
    FROM pago pa
    INNER JOIN suscripcion s ON s.id_suscripcion = pa.det_suscripcion
    INNER JOIN cliente c ON c.id_cliente = s.det_cliente
    INNER JOIN plan p ON p.id_plan = s.det_plan
    ORDER BY pa.fecha_pago DESC, pa.id_pago DESC
  `);
  return rows;
}
