import { apiHandler, ticketsRepo } from "helpers/api";

export default apiHandler({
  post: getTicketsForSupply,
});

async function getTicketsForSupply(req, res) {
  const tickets = await ticketsRepo.getTicketsForSupply(req.body);
  return res.status(200).json(tickets);
}
