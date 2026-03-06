import { apiHandler, flightsRepo } from "helpers/api";

export default apiHandler({
  get: getAll,
});

async function getAll(req, res) {
  const flights = await flightsRepo.getAll(req.body);
  return res.status(200).json(flights);
}
