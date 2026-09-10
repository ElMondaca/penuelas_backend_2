import * as service from '../services/pagos.service.js';

export async function list(_req, res) {
  res.json(await service.listPagos());
}
