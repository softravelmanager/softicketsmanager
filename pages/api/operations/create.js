import { apiHandler, operationsRepo } from "helpers/api";

export default apiHandler({
  post: create,
});

async function create(req, res) {
  await operationsRepo.create(req.body);
  return res.status(200).json({});
}
