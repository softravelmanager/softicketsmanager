import { apiHandler, expensesRepo } from "helpers/api";

export default apiHandler({
  post: getAll,
});

async function getAll(req, res) {
  const expenses = await expensesRepo.getAll(req.body);
  return res.status(200).json(expenses);
}
