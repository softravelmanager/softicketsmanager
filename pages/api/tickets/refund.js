import { apiHandler, ticketsRepo } from "helpers/api";

export default apiHandler({
  post: getRefundsForSupply,
});

async function getRefundsForSupply(req, res) {
  const tickets = await ticketsRepo.getRefundsForSupply(req.body);
  return res.status(200).json(tickets);
}
