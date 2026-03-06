import { apiHandler, usersRepo } from "helpers/api";

export default apiHandler({
  get: getAll,
});

async function getAll(req, res) {
  const users1 = await usersRepo.getAllAgents();
  const users = (users1 || []).sort((a, b) => a.firstName - b.firstName);
  return res.status(200).json(users);
}
