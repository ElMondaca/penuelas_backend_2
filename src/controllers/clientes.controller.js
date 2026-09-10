import * as service from '../services/clientes.service.js';
import { notFound } from '../utils/helpers.js';

export async function list(req, res) {
  res.json(await service.listClientes(req.query.q));
}

export async function create(req, res) {
  res.status(201).json(await service.createCliente(req.body));
}

export async function update(req, res) {
  const cliente = await service.updateCliente(Number(req.params.id), req.body);
  if (!cliente) throw notFound('El cliente no existe.');
  res.json(cliente);
}
