import { apiHandler, flightsRepo } from "helpers/api";

export default apiHandler({
  post: create,
});

async function create(req, res) {
  await flightsRepo.create(req.body);
  return res.status(200).json({});
}
