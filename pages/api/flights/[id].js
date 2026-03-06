import { apiHandler, flightsRepo } from "helpers/api";

export default apiHandler({
  get: getById,
  put: update,
  delete: _delete,
});

async function getById(req, res) {
  const flight = await flightsRepo.getById(req.query.id);

  if (!flight) throw "flight Not Found";

  return res.status(200).json(flight);
}

async function update(req, res) {
  await flightsRepo.update(req.query.id, req.body);
  return res.status(200).json({});
}

async function _delete(req, res) {
  await flightsRepo.delete(req.query.id);
  return res.status(200).json({});
}
