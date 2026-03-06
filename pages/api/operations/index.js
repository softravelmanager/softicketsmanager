import { apiHandler, operationsRepo } from "helpers/api";

export default apiHandler({
  post: getAll,
});

async function getAll(req, res) {
  const users = await operationsRepo.getAll(req.body);
  return res.status(200).json(users);
}
