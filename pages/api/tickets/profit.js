import { apiHandler, ticketsRepo } from "helpers/api";

export default apiHandler({
  get: getBookings,
  post: getProfit,
});

async function getProfit(req, res) {
  const tickets = await ticketsRepo.getProfit(req.body);
  return res.status(200).json(tickets);
}

async function getBookings(req, res) {
  const tickets = await ticketsRepo.getBookings();
  return res.status(200).json(tickets);
}