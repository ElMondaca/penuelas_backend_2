import { pool } from '../config/database.js';
import { badRequest, money, positiveInteger, required } from '../utils/helpers.js';

function validateUnit(unit) {
  const value = String(unit || '').toUpperCase();
  if (!['DIAS', 'MESES'].includes(value)) throw badRequest('La unidad de duración no es válida.');
  return value;
}

export async function listPlanes() {
  const [rows] = await pool.query(`
    SELECT *, (valor_plan - descuento_plan) AS valor_final_plan
    FROM plan ORDER BY activo_plan DESC, nombre_plan
  `);
  return rows;
}

export async function getPlan(id, onlyActive = false) {
  const [rows] = await pool.query(`
    SELECT *, (valor_plan - descuento_plan) AS valor_final_plan
    FROM plan WHERE id_plan = ? ${onlyActive ? 'AND activo_plan = 1' : ''}
  `, [id]);
  return rows[0] || null;
}

export async function createPlan(body) {
  const valor = money(body.valor_plan);
  const descuento = money(body.descuento_plan);
  if (descuento > valor) throw badRequest('El descuento no puede superar el valor del plan.');
  const [result] = await pool.execute(`
    INSERT INTO plan (nombre_plan, valor_plan, descuento_plan, duracion_plan, unidad_duracion_plan)
    VALUES (?, ?, ?, ?, ?)
  `, [required(body.nombre_plan, 'nombre'), valor, descuento,
      positiveInteger(body.duracion_plan, 'La duración'), validateUnit(body.unidad_duracion_plan)]);
  return getPlan(result.insertId);
}

export async function updatePlan(id, body) {
  const valor = money(body.valor_plan);
  const descuento = money(body.descuento_plan);
  if (descuento > valor) throw badRequest('El descuento no puede superar el valor del plan.');
  await pool.execute(`
    UPDATE plan SET nombre_plan = ?, valor_plan = ?, descuento_plan = ?, duracion_plan = ?,
      unidad_duracion_plan = ?, activo_plan = ? WHERE id_plan = ?
  `, [required(body.nombre_plan, 'nombre'), valor, descuento,
      positiveInteger(body.duracion_plan, 'La duración'), validateUnit(body.unidad_duracion_plan),
      body.activo_plan ? 1 : 0, id]);
  return getPlan(id);
}
