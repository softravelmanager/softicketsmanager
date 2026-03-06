import {
  alertService,
  ticketsService,
  operationsService,
  formatDate,
} from "services";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Spinner } from "components";

export { Budget };

function Budget(props) {
  const refunds = props.refunds;
  const { totalRefund, totalRefundUsed, totalRemained } = props.totals;
  const [tickets, setTickets] = useState(null);
  const [totals, setTotals] = useState({
    totalCost: 0,
    totalPaidB2B: 0,
    totalRemainedB2B: 0,
  });
  const [delta, setDelta] = useState(0);
  const [total, setTotal] = useState(0);
  const [refundTot, setRefundTot] = useState(0);
  const [date, setDate] = useState(null);
  const [budgetTot, setBudgetTot] = useState(0);
  const [changesRefunds, setChangesRefunds] = useState([]);
  const [changesSupplied, setChangesSupplied] = useState([]);

  const swal = Swal.mixin({
    customClass: {
      confirmButton: "m-1 btn btn-success",
      cancelButton: "btn btn-danger",
    },
    buttonsStyling: false,
  });

  function ask() {
    swal
      .fire({
        title: "Are you sure?",
        text: "You want to save operations to database?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "Cancel",
        reverseButtons: true,
      })
      .then((result) => {
        if (result.isConfirmed) {
          const resp = onComplete();
          if (resp) {
            let { errorI, errorU } = resp;

            if (!errorI && !errorU) {
              swal
                .fire(
                  "Saved",
                  "Your operations has been saved successfully.",
                  "success"
                )
                .then((res) => {
                  if (res.isDismissed || res.isConfirmed) {
                    window.location.reload();
                  }
                });
            } else {
              swal.fire(
                "Error!",
                "An error occurred while saving operations.",
                "error"
              );
            }
          }
        }
      });
  }

  useEffect(() => {
    document.getElementById("complete").setAttribute("disabled", "disabled");
    getTickets().finally((res) => {
      setTimeout(() => {
        disableEnableInputsOnDeltaZeroOrBudgetFieldsNotSet("d");
      }, 1000);
    });
  }, []);

  async function getTickets() {
    const res = await ticketsService.getTicketsForSupply();
    let totalCost = 0;
    let totalPaidB2B = 0;
    let totalRemainedB2B = 0;
    const res2 = res.map((e) => {
      let remained = e.paidAmount - (e.supplied || 0);

      totalCost += parseFloat(e.paidAmount || 0);
      totalPaidB2B += parseFloat(e.supplied || 0);
      totalRemainedB2B += parseFloat(remained || 0);
      return {
        ...e,
        supplied: e.supplied ? e.supplied : 0,
        remained: parseFloat(remained).toFixed(2),
      };
    });
    setTickets(res2);
    setTotals({ totalCost, totalPaidB2B, totalRemainedB2B });
  }

  function disableInputsForTransferAndRefunds() {
    document.getElementById("budget").setAttribute("disabled", "disabled");
    document.getElementById("budget-date").setAttribute("disabled", "disabled");
    document.getElementById("add").setAttribute("disabled", "disabled");
    if (refunds.length) {
      document
        .getElementById("remained-button")
        .setAttribute("disabled", "disabled");
    }
    let elements = document.getElementsByClassName("remained");
    for (let i = 0; i < elements.length; i++) {
      elements[i].setAttribute("disabled", "disabled");
    }
  }

  function disableEnableInputsOnDeltaZeroOrBudgetFieldsNotSet(type) {
    let disabled = type === "d";
    let elements = document.getElementsByClassName("tickets-field");
    for (let i = 0; i < elements.length; i++) {
      if (disabled) {
        elements[i].setAttribute("disabled", "disabled");
      } else {
        elements[i].removeAttribute("disabled");
      }
    }
    let elements2 = document.getElementsByClassName("tickets-field-edit");
    for (let i = 0; i < elements2.length; i++) {
      elements2[i].setAttribute("disabled", "disabled");
    }
  }

  function onComplete() {
    let deltaI = parseFloat(delta).toFixed(2);
    if (deltaI === "0.00" && changesSupplied.length > 0) {
      let errorU = false;
      let errorI = false;
      const allTotals = [...changesSupplied, ...changesRefunds];
      //console.log(allTotals);
      let transferName = Date.now();
      allTotals.map((e) => {
        let params = {};
        if (e.type === "supplied") {
          params = { supplied: e.total };
        } else {
          params = { refundUsed: e.total };
        }
        ticketsService.update(e.id, params).catch((err) => (errorU = true));
        let data = {};
        if (e.type === "supplied") {
          data = {
            transferName,
            totalOperation: total,
            transferAmountTotalOperation: budgetTot,
            refundAmountTotalOperation: refundTot.toFixed(2),
            ticketId: e.id,
            transferDate: formatDate(date, "DB"),
            operation: "Paid to B2B",
            ticketRefundUsed: "",
            suppliedTicket: e.paid,
          };
        } else {
          data = {
            transferName,
            totalOperation: total,
            transferAmountTotalOperation: budgetTot,
            refundAmountTotalOperation: refundTot.toFixed(2),
            ticketId: e.id,
            transferDate: formatDate(date, "DB"),
            operation: "Refund Used",
            ticketRefundUsed: e.used,
            suppliedTicket: "",
          };
        }
        operationsService.create(data).catch((err) => (errorI = true));
      });
      return { errorU, errorI };
    } /*else {
      console.log("no");
    }*/
    return null;
  }

  function onAdd(e) {
    e.preventDefault();
    alertService.clear();
    const dateT = document.getElementById("budget-date").value;
    setDate(dateT);
    setDelta(total);
    try {
      if (total > 0 && dateT) {
        disableInputsForTransferAndRefunds();
        disableEnableInputsOnDeltaZeroOrBudgetFieldsNotSet("e");
      }
    } catch (error) {
      alertService.error(error);
      console.error(error);
    }
  }

  function adjustTotal(number, type) {
    let totalT = 0;
    if (type === "r") {
      totalT = number + budgetTot;
    } else {
      totalT = number + refundTot;
    }
    totalT = parseFloat(totalT).toFixed(2);
    setTotal(totalT);
  }

  function addBudget(e) {
    let number = e && parseFloat(e.target.value);
    if (!isNaN(number)) {
      setBudgetTot(number);
      adjustTotal(number, "b");
    }
  }

  function addRefunds() {
    let elements = document.getElementsByClassName("remained");
    let changesT = [];
    let number = 0;
    for (let i = 0; i < elements.length; i++) {
      let used = elements[i].value.trim() || "";
      let id = (elements[i].classList[1] || "").replace("remained-input-", "");
      let remainedA = refunds.filter((e) => e.id === id) || [];
      let remainedI = remainedA.length && remainedA[0]["remained"];
      let refundUsed = remainedA.length && remainedA[0]["refundUsed"];
      if (used && remainedI) {
        used = parseFloat(used);
        remainedI = parseFloat(remainedI);
        if (used <= remainedI && used > 0) {
          //console.log(remainedA);
          let total = parseFloat(refundUsed) + used;
          number += used;
          total = total.toFixed(2);
          used = used.toFixed(2);
          changesT.push({ id, used, total, type: "refund" });

          document.getElementsByClassName(
            "remained-ok-" + id
          )[0].hidden = false;
          document.getElementsByClassName("remained-ko-" + id)[0].hidden = true;
        } else {
          document.getElementsByClassName(
            "remained-ko-" + id
          )[0].hidden = false;
          document.getElementsByClassName("remained-ok-" + id)[0].hidden = true;
        }
      }
    }
    if (changesT) {
      setChangesRefunds(changesT);
      setRefundTot(number);
      adjustTotal(number, "r");
    }
  }

  function editSupplied(id, remained, supplied) {
    let number = document.getElementsByClassName("tickets-input-" + id)[0]
      .value;
    let numberI = parseFloat(number);
    let deltaI = parseFloat(delta);
    deltaI = deltaI + numberI;
    setDelta(deltaI);
    document.getElementsByClassName("tickets-input-" + id)[0].value = 0;
    document
      .getElementsByClassName("tickets-btn-ok-" + id)[0]
      .removeAttribute("disabled");
    document
      .getElementsByClassName("tickets-btn-edit-" + id)[0]
      .setAttribute("disabled", "disabled");
    document
      .getElementsByClassName("tickets-input-" + id)[0]
      .removeAttribute("disabled");
  }

  function addSupplied(id, remained, supplied) {
    let number = document.getElementsByClassName("tickets-input-" + id)[0]
      .value;
    let numberI = parseFloat(number);
    supplied = parseFloat(supplied);
    number = parseFloat(number);
    remained = parseFloat(remained);
    let deltaI = parseFloat(delta);
    if (
      !isNaN(number) &&
      number > 0 &&
      number <= deltaI &&
      number <= remained
    ) {
      number = number + supplied;
      number = number.toFixed(2);
      let deltaT = deltaI - numberI;
      deltaT = parseFloat(deltaT).toFixed(2);
      numberI = numberI.toFixed(2);
      document
        .getElementsByClassName("tickets-btn-ok-" + id)[0]
        .setAttribute("disabled", "disabled");
      document.getElementsByClassName("tickets-ko-" + id)[0].hidden = true;
      document.getElementsByClassName("tickets-ok-" + id)[0].hidden = false;
      document
        .getElementsByClassName("tickets-btn-edit-" + id)[0]
        .removeAttribute("disabled");
      document
        .getElementsByClassName("tickets-input-" + id)[0]
        .setAttribute("disabled", "disabled");
      let newSupplies = [...changesSupplied];
      const found = newSupplies.some((el) => el.id === id);
      if (found) {
        newSupplies = newSupplies.filter((e) => e.id !== id);
      }
      newSupplies.push({ id, paid: numberI, total: number, type: "supplied" });
      setChangesSupplied(newSupplies);
      setDelta(deltaT);

      if (deltaT === "0.00") {
        document.getElementById("complete").removeAttribute("disabled");
        disableEnableInputsOnDeltaZeroOrBudgetFieldsNotSet("d");
      }
    } else {
      document.getElementsByClassName("tickets-ko-" + id)[0].hidden = false;
      document.getElementsByClassName("tickets-ok-" + id)[0].hidden = true;
    }

    return false;
  }

  return (
    <>
      <form id="add-form" onSubmit={(e) => onAdd(e)}>
        <div className="row">
          <div className="col-md-2">
            <label className="form-label">
              Date: <span className="text-danger">*</span>
            </label>
            <input
              name="budget-date"
              id="budget-date"
              type="date"
              className="form-control"
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">
              Bonifico: <span className="text-danger">*</span>
            </label>
            <input
              name="budget"
              id="budget"
              type="number"
              step="0.01"
              onChange={(e) => {
                addBudget(e);
              }}
              className="form-control"
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Refund:</label>
            <input
              name="refund"
              disabled
              value={refundTot}
              type="number"
              step="0.01"
              className="form-control"
            />
          </div>
          <div className="col-md-2">
            <div className="text-center">Total - Remained</div>
            <div className="text-center mt-3">
              € {total} - € {delta}
            </div>
          </div>
          <div className="col-md-2">
            <br />
            <button type="submit" id="add" className="btn btn-primary me-2">
              Start Transferring
            </button>
          </div>
          <div className="col-md-2">
            <br />
            <button
              onClick={() => {
                ask();
              }}
              type="button"
              id="complete"
              className="btn btn-success me-2"
            >
              Complete Transfer
            </button>
          </div>
        </div>
      </form>
      <br />
      <div className="accordion" id="accordionExample">
        <div className="accordion-item">
          <h2 className="accordion-header" id="headingOne">
            <button
              className="accordion-button"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapseOne"
              aria-expanded="true"
              aria-controls="collapseOne"
            >
              {refunds.length
                ? refunds.length + " Refunds"
                : "No tickets with refund"}
            </button>
          </h2>
          <div
            id="collapseOne"
            className="accordion-collapse collapse collapse"
            aria-labelledby="headingOne"
            data-bs-parent="#accordionExample"
          >
            <div style={{ textAlign: "center" }}>
              {refunds.length ? (
                <button
                  onClick={() => addRefunds()}
                  id="remained-button"
                  className="btn btn-primary"
                >
                  Add to Bonifico
                </button>
              ) : (
                ""
              )}
            </div>
            <div className="accordion-body">
              <div className="table-responsive">
                <table className="table table-striped table-sm">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">PNR</th>
                      <th scope="col">Total Refund</th>
                      <th scope="col">Refund Used</th>
                      <th scope="col">Remained</th>
                      <th scope="col">Add</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refunds.map((r, i) => {
                      return (
                        <tr key={i}>
                          <td>{r.name}</td>
                          <td>{r.bookingCode}</td>
                          <td>€ {r.refund}</td>
                          <td>€ {r.refundUsed}</td>
                          <td>€ {r.remained}</td>
                          <td>
                            <input
                              className={"remained remained-input-" + r.id}
                              placeholder="remained to use"
                              type="number"
                              step="0.01"
                              min="0"
                              max={r.remained}
                            />
                            &nbsp;
                            <label
                              hidden
                              className={`remained-ok-${r.id} text-success`}
                            >
                              <i className="fa fa-check"></i>
                            </label>
                            <label
                              hidden
                              className={`remained-ko-${r.id} text-danger`}
                            >
                              <i className="fa fa-times"></i>
                            </label>
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <th>Totals:</th>
                      <th></th>
                      <th>€ {totalRefund.toFixed(2)}</th>
                      <th>€ {totalRefundUsed.toFixed(2)}</th>
                      <th>€ {totalRemained.toFixed(2)}</th>
                      <th></th>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <br />
      <div className="accordion" id="accordionExample1">
        <div className="accordion-item">
          <h2 className="accordion-header" id="headingOne">
            <button
              className="accordion-button"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapseOne1"
              aria-expanded="true"
              aria-controls="collapseOne"
            >
              {tickets && tickets.length
                ? tickets.length + " Tickets"
                : "No tickets to adjust"}
            </button>
          </h2>
          <div
            id="collapseOne1"
            className="accordion-collapse collapse collapse"
            aria-labelledby="headingOne"
            data-bs-parent="#accordionExample1"
          >
            <div className="accordion-body">
              <div className="table-responsive">
                <table className="table table-striped table-sm">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">PNR</th>
                      <th scope="col">Cost</th>
                      <th scope="col">Paid to Supplier</th>
                      <th scope="col">Remained</th>
                      <th scope="col">Pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets &&
                      tickets.map((r, i) => {
                        return (
                          <tr key={i}>
                            <td>{r.name}</td>
                            <td>{r.bookingCode}</td>
                            <td>€ {r.paidAmount}</td>
                            <td>€ {r.supplied}</td>
                            <td>€ {r.remained}</td>
                            <td>
                              <input
                                className={
                                  "tickets tickets-field tickets-input-" + r.id
                                }
                                placeholder="remained to pay"
                                type="number"
                                step="0.01"
                                min="0"
                                max={r.remained}
                              />
                              &nbsp;
                              <button
                                className={
                                  "tickets-field tickets-field-ok tickets-btn-ok-" +
                                  r.id
                                }
                                onClick={() => {
                                  addSupplied(r.id, r.remained, r.supplied);
                                }}
                              >
                                Ok
                              </button>
                              &nbsp;
                              <button
                                className={
                                  "tickets-field tickets-field-edit tickets-btn-edit-" +
                                  r.id
                                }
                                onClick={() => {
                                  editSupplied(r.id, r.remained, r.supplied);
                                }}
                              >
                                <i className="fa fa-pencil"></i>
                              </button>
                              &nbsp;
                              <label
                                hidden
                                className={`tickets-ok-${r.id} text-success`}
                              >
                                <i className="fa fa-check"></i>
                              </label>
                              <label
                                hidden
                                className={`tickets-ko-${r.id} text-danger`}
                              >
                                <i className="fa fa-times"></i>
                              </label>
                            </td>
                          </tr>
                        );
                      })}
                    {!tickets && (
                      <tr>
                        <td colSpan="4">
                          <Spinner />
                        </td>
                      </tr>
                    )}
                    <tr>
                      <th>Totals:</th>
                      <th></th>
                      <th>{totals.totalCost.toFixed(2)}</th>
                      <th>{totals.totalPaidB2B.toFixed(2)}</th>
                      <th>{totals.totalRemainedB2B.toFixed(2)}</th>
                      <th></th>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
