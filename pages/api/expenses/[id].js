import { apiHandler, expensesRepo } from "helpers/api";

export default apiHandler({
  get: getById,
  put: update,
  delete: _delete,
});

async function getById(req, res) {
  const expense = await expensesRepo.getById(req.query.id);

  if (!expense) throw "expense Not Found";

  return res.status(200).json(expense);
}

async function update(req, res) {
  await expensesRepo.update(req.query.id, req.body);
  return res.status(200).json({});
}

async function _delete(req, res) {
  await expensesRepo.delete(req.query.id);
  return res.status(200).json({});
}
