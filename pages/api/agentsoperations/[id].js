import { apiHandler, agentsOperationsRepo } from "helpers/api";

export default apiHandler({
  delete: _delete,
});

async function _delete(req, res) {
  await agentsOperationsRepo.delete(req.query.id);
  return res.status(200).json({});
}
