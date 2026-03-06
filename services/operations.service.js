import { fetchWrapper } from "helpers";
import { formatDate } from "./index";

const baseUrl = `/api/operations`;

export const operationsService = {
  getAll,
  create,
  delete: _delete,
};

async function getAll(filters) {
  const response = await fetchWrapper.post(baseUrl, filters);
  const data = response.map((e) => {
    let ticket = e?.ticket[0] || [];
    let paidAmount = parseFloat(ticket.paidAmount);
    let supplied = parseFloat(ticket.supplied || 0);
    let refundUsed = parseFloat(ticket.refundUsed || 0);
    let refund = parseFloat(ticket.refund || 0);
    let remainedRefund =
      parseFloat(ticket.refund) - parseFloat(ticket.refundUsed || 0);
    let remainedSupplied =
      parseFloat(ticket.paidAmount) - parseFloat(ticket.supplied || 0);
    return {
      ...e,
      cid: e._id,
      transferDate: formatDate(e.transferDate, "IT"),
      suppliedTicketN: e.suppliedTicket,
      suppliedTicket: e.suppliedTicket ? "€ " + e.suppliedTicket : "-",
      ticketRefundUsedN: e.ticketRefundUsed,
      ticketRefundUsed: e.ticketRefundUsed ? "€ " + e.ticketRefundUsed : "-",
      remainedRefund: ticket.refund ? "€ " + remainedRefund.toFixed(2) : "-",
      remainedSupplied: "€ " + remainedSupplied.toFixed(2),
      paidAmount: "€ " + paidAmount.toFixed(2),
      supplied: "€ " + supplied.toFixed(2),
      refund: "€ " + refund.toFixed(2),
      refundUsed: "€ " + refundUsed.toFixed(2),
      name: ticket.name,
      bookingCode: ticket.bookingCode,
      totalOperation: e.totalOperation ? "€ " + e.totalOperation : "",
      transferAmountTotalOperation: "€ " + e.transferAmountTotalOperation,
      refundAmountTotalOperation: "€ " + e.refundAmountTotalOperation,
      transferAmountTotalOperationN: e.transferAmountTotalOperation,
      refundAmountTotalOperationN: e.refundAmountTotalOperation,
    };
  });
  return data;
}

async function create(operation) {
  await fetchWrapper.post(`${baseUrl}/create`, operation);
}

async function _delete(id) {
  await fetchWrapper.delete(`${baseUrl}/${id}`);
}
