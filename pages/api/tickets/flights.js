import { apiHandler, ticketsRepo } from "helpers/api";

export default apiHandler({
  post: getFlights,
});

async function getFlights(req, res) {
  const tickets = await ticketsRepo.getFlights(req.body);
  return res.status(200).json(tickets);
}
