import { apiHandler, ticketsRepo } from "helpers/api";

export default apiHandler({
  post: getTicketsByAgent,
});

async function getTicketsByAgent(req, res) {
  const tickets = await ticketsRepo.getTicketsByAgent(req.body);
  return res.status(200).json(tickets);
}
