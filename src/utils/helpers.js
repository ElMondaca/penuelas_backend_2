export function required(value, field) {
  const text = String(value ?? '').trim();
  if (!text) throw badRequest(`El campo ${field} es obligatorio.`);
  return text;
}

export function money(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 0) throw badRequest('El monto debe ser un número mayor o igual a 0.');
  return n;
}

export function positiveInteger(value, field = 'valor') {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw badRequest(`${field} debe ser un entero mayor a 0.`);
  return n;
}

export function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

export function notFound(message) {
  const error = new Error(message);
  error.status = 404;
  return error;
}

export function normalizeOptional(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

export function dateOnly(value, field) {
  const text = String(value ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw badRequest(`La ${field} no es válida.`);
  return text;
}

export function initialsCode(nombre, apellido) {
  const first = String(nombre || '').trim().charAt(0).toUpperCase() || 'X';
  const second = String(apellido || '').trim().charAt(0).toUpperCase() || 'X';
  return `${first}${second}`;
}
