import * as service from '../services/planes.service.js';

export async function list(_req, res) {
  res.json(await service.listPlanes());
}

export async function create(req, res) {
  res.status(201).json(await service.createPlan(req.body));
}

export async function update(req, res) {
  res.json(await service.updatePlan(Number(req.params.id), req.body));
}
