import { apiHandler, agentsOperationsRepo } from "helpers/api";

export default apiHandler({
  post: create,
});

async function create(req, res) {
  await agentsOperationsRepo.create(req.body);
  return res.status(200).json({});
}
