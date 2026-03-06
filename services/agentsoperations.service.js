import { fetchWrapper } from "helpers";
import { formatDate } from "./index";

const baseUrl = `/api/agentsoperations`;
const ticketsUrl = `/api/tickets`;

export const agentsOperationsService = {
  getAll,
  create,
  delete: _delete,
};

async function getAll(filters) {
  const response = await fetchWrapper.post(baseUrl, filters);
  let filtersT = { ...filters, type: "bookedOn" };
  const ticketsT = await fetchWrapper.post(ticketsUrl, filtersT);

  let tickets = [];
  let ticketsIds = [];
  ticketsT.map((t) => {
    if (
      (filters.agent === null && t.agentCost.trim() !== "0") ||
      filters.agent === t.agentId
    ) {
      ticketsIds.push(t.id);
      tickets.push(t);
    }
  });

  let data = response.map((e) => {
    let ticket = e?.ticket[0] || [];
    let agent = e?.agent[0];
    let paidAmount = parseFloat(ticket.agentCost || 0);
    let supplied = parseFloat(ticket.paidByAgent || 0);
    let remainedSupplied =
      parseFloat(ticket.agentCost || 0) - parseFloat(ticket.paidByAgent || 0);

    if (
      !ticketsIds.includes(ticket?._id) &&
      (filters.agent === null || filters.agent === ticket.agentId)
    ) {
      ticketsIds.push(ticket._id);
      tickets.push(ticket);
    }
    return {
      ...e,
      cid: e._id,
      transferDate: formatDate(e.transferDate, "IT"),
      balanceOperation: e.balanceOperation ? "€ " + e.balanceOperation : "-",
      balanceOperationN: e.balanceOperation,
      balanceOperationDelta: e.balanceOperationDelta
        ? "€ " + e.balanceOperationDelta
        : "-",
      balanceOperationDeltaN: e.balanceOperationDelta,
      remainedSupplied: "€ " + remainedSupplied.toFixed(2),
      paidAmount: "€ " + paidAmount.toFixed(2),
      supplied: "€ " + supplied.toFixed(2),
      name: ticket.name,
      agentName: agent ? agent.firstName + " " + agent.lastName : "Not Found",
      bookingCode: ticket.bookingCode,
      totalOperation: e.totalOperation ? "€ " + e.totalOperation : "",
      transferOperation: "€ " + e.transferOperation,
      transferOperationN: e.transferOperation,
      suppliedTicket: "€ " + e.suppliedTicket,
      suppliedTicketN: e.suppliedTicket,
      suppliedTotal: "€ " + parseFloat(e.suppliedTotal).toFixed(2),
      suppliedTotalN: parseFloat(e.suppliedTotal).toFixed(2),
    };
  });
  return { data, tickets };
}

async function create(operation) {
  await fetchWrapper.post(`${baseUrl}/create`, operation);
}

async function _delete(id) {
  await fetchWrapper.delete(`${baseUrl}/${id}`);
}
