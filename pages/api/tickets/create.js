import { apiHandler, ticketsRepo } from "helpers/api";

export default apiHandler({
  post: create,
});

async function create(req, res) {
  await ticketsRepo.create(req.body);
  return res.status(200).json({});
}
