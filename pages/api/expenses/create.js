import { apiHandler, expensesRepo } from "helpers/api";

export default apiHandler({
  post: create,
});

async function create(req, res) {
  await expensesRepo.create(req.body);
  return res.status(200).json({});
}
