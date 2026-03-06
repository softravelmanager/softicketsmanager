import { apiHandler, ticketsRepo } from "helpers/api";

export default apiHandler({
  post: getAll,
  put: findAndUpdate,
});

async function getAll(req, res) {
  const tickets = await ticketsRepo.getAll(req.body);
  return res.status(200).json(tickets);
}

async function findAndUpdate(req, res) {
  await ticketsRepo.findAndUpdate(req.body);
  return res.status(200).json({});
}
