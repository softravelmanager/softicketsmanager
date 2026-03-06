import Link from "next/link";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

import { ticketsService, alertService, formatDate, categories } from "services";

export { AddEdit };

function AddEdit(props) {
  const ticket = props?.ticket;
  const agents = props?.agents || [];
  // form validation rules
  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Customer is required"),
    paid: Yup.number().required("Paid Amount is required"),
    receiving: Yup.string().notRequired(),
    method: Yup.string().notRequired(),
    agent: Yup.string().notRequired(),
    iata: Yup.string().notRequired(),
    agentCost: Yup.string().notRequired(),
    booked: Yup.date().required("Booked On is required"),
    bookcode: Yup.string().required("Booking code is required"),
    ticket: Yup.string().required("Ticket  number is required"),
    card: Yup.string().notRequired(),
    travel1: Yup.string().notRequired(),
    travel2: Yup.string().notRequired(),
    dates: Yup.string().notRequired(),
    phone: Yup.string().notRequired(),
    flight: Yup.string().notRequired(),
    receivingAmount1Date: Yup.string().notRequired(),
    receivingAmount2: Yup.string().notRequired(),
    receivingAmount2Date: Yup.string().notRequired(),
    receivingAmount2Method: Yup.string().notRequired(),
    receivingAmount3: Yup.string().notRequired(),
    receivingAmount3Date: Yup.string().notRequired(),
    receivingAmount3Method: Yup.string().notRequired(),
    refund: Yup.string().notRequired(),
    refundUsed: Yup.string().notRequired(),
    supplied: Yup.string().notRequired(),
    refundDate: Yup.string().notRequired(),
    returned: Yup.string().notRequired(),
    returnedDate: Yup.string().notRequired(),
    paidByAgent: Yup.string().notRequired(),
    desc: Yup.string().notRequired(),
  });
  const formOptions = { resolver: yupResolver(validationSchema) };

  // get functions to build form with useForm() hook
  const { register, handleSubmit, reset, formState } = useForm(formOptions);
  const { errors } = formState;

  async function onSubmit(data) {
    alertService.clear();
    try {
      // create or update user based on user prop
      let ticketNew = {
        fileName: data.name,
        name: data.name,
        agent: data.agent,
        agentId: data.agent,
        iata: data.iata || "",
        agentCost: data.agentCost,
        paymentMethod: data.method,
        bookingCode: data.bookcode,
        bookedOn: formatDate(data.booked),
        ticketNumber: data.ticket,
        paidAmount: data.paid,
        receivingAmount1: data.receiving || 0,
        receivingAmount1Date:
          data.receivingAmount1Date && formatDate(data.receivingAmount1Date),
        receivingAmount2: data.receivingAmount2 || 0,
        receivingAmount3: data.receivingAmount3 || 0,
        receivingAmount2Date:
          data.receivingAmount2Date && formatDate(data.receivingAmount2Date),
        receivingAmount3Date:
          data.receivingAmount3Date && formatDate(data.receivingAmount3Date),
        receivingAmount2Method: data.receivingAmount2Method || "",
        receivingAmount3Method: data.receivingAmount3Method || "",
        cardNumber: data.card || "",
        travel1: data.travel1 || "",
        travel2: data.travel2 || "",
        dates: data.dates || "",
        phone: data.phone || "",
        flight: data.flight || "",
        refund: data.refund || "",
        refundUsed: data.refundUsed || 0,
        supplied: data.supplied || 0,
        refundDate: data.refundDate || "",
        returned: data.returned || 0,
        returnedDate: data.returnedDate || "",
        paidByAgent: data.paidByAgent || 0,
        desc: data.desc || "",
      };
      if (!ticket) {
        await ticketsService.create(ticketNew);
        document.getElementById("add-form").reset();
        reset({
          name: "",
          paid: "",
          receiving: "",
          agent: "",
          agentId: "",
          iata: "",
          agentCost: "",
          method: "",
          bookcode: "",
          ticket: "",
          booked: "",
          card: "",
          travel1: "",
          travel2: "",
          dates: "",
          phone: "",
          flight: "",
          refund: "",
          refundUsed: "",
          supplied: "",
          refundDate: "",
          returned: "",
          returnedDate: "",
          paidByAgent: 0,
          desc: "",
        });
        alertService.success(
          "Ticket for " + ticketNew.name + " added successfully",
          true
        );
      } else {
        await ticketsService.update(ticket.id, ticketNew);
        alertService.success(
          "Ticket for " + ticketNew.name + " updated successfully"
        );
      }
      console.log(ticketNew);
    } catch (error) {
      alertService.error(error);
      console.error(error);
    }
  }

  return (
    <form id="add-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="row">
        <div className="mb-3 col-md-4 col-sm-6">
          <label className="form-label">
            Passenger <span className="text-danger">*</span>
          </label>
          <input
            name="name"
            defaultValue={ticket?.name}
            type="text"
            {...register("name")}
            className={`form-control ${errors.name ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.name?.message}</div>
        </div>
        <div className="mb-3 col-md-4 col-sm-6">
          <label className="form-label">Agent</label>
          <select
            name="agent"
            defaultValue={ticket?.agentId}
            type="text"
            {...register("agent")}
            className={`form-control ${errors.agentId ? "is-invalid" : ""}`}
          >
            {agents.map((agent, index) => {
              return (
                <option
                  key={"agent" + index}
                  value={agent.id}
                  defaultValue={ticket?.agentId}
                >
                  {agent.firstName} {agent.lastName}
                </option>
              );
            })}
          </select>
          <div className="invalid-feedback">{errors.agent?.message}</div>
        </div>
        <div className="mb-3 col-md-4 col-sm-6">
          <label className="form-label">Agent Cost (for Ticket)</label>
          <input
            name="agentCost"
            defaultValue={ticket?.agentCost || 0}
            type="number"
            step="0.01"
            {...register("agentCost")}
            className={`form-control ${errors.agentCost ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.agentCost?.message}</div>
        </div>
      </div>
      <div className="row">
        <div className="mb-3 col">
          <label className="form-label">
            Cost <span className="text-danger">*</span>
          </label>
          <input
            name="paid"
            defaultValue={ticket?.paidAmount}
            type="number"
            step="0.01"
            {...register("paid")}
            className={`form-control ${errors.paid ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.paid?.message}</div>
        </div>
        <div className="mb-3 col">
          <label className="form-label">
            Issue date <span className="text-danger">*</span>
          </label>
          <input
            name="booked"
            defaultValue={ticket?.bookedOn}
            type="date"
            {...register("booked")}
            className={`form-control ${errors.booked ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.booked?.message}</div>
        </div>
        <div className="mb-3 col">
          <label className="form-label">Issued By</label>
          <input
            name="iata"
            defaultValue={ticket?.iata}
            type="text"
            {...register("iata")}
            className={`form-control ${errors.iata ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.iata?.message}</div>
        </div>
      </div>

      <div className="row">
        <div className="mb-3 col">
          <label className="form-label">Receiving Amount 1</label>
          <input
            name="receiving"
            defaultValue={ticket?.receivingAmount1}
            type="number"
            step="0.01"
            {...register("receiving")}
            className={`form-control ${errors.receiving ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.receiving?.message}</div>
        </div>
        <div className="mb-3 col">
          <label className="form-label">Receiving Amount 1 Date</label>
          <input
            name="receivingAmount1Date"
            defaultValue={ticket?.receivingAmount1Date}
            type="date"
            {...register("receivingAmount1Date")}
            className={`form-control ${
              errors.receivingAmount1Date ? "is-invalid" : ""
            }`}
          />
          <div className="invalid-feedback">
            {errors.receivingAmount1Date?.message}
          </div>
        </div>
        <div className="mb-3 col-md-4 col-sm-6">
          <label className="form-label">Payment Method 1</label>
          <input
            name="method"
            defaultValue={ticket?.paymentMethod}
            type="text"
            {...register("method")}
            className={`form-control ${errors.method ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.method?.message}</div>
        </div>
      </div>

      <div className="row">
        <div className="mb-3 col">
          <label className="form-label">
            Ticket Number <span className="text-danger">*</span>
          </label>
          <input
            name="ticket"
            defaultValue={ticket?.ticketNumber}
            type="text"
            {...register("ticket")}
            className={`form-control ${errors.ticket ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.ticket?.message}</div>
        </div>
        <div className="mb-3 col">
          <label className="form-label">
            PNR <span className="text-danger">*</span>
          </label>
          <input
            name="bookcode"
            defaultValue={ticket?.bookingCode}
            type="text"
            {...register("bookcode")}
            className={`form-control ${errors.bookcode ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.bookcode?.message}</div>
        </div>
      </div>

      <div className="row">
        <div className="mb-3 col">
          <label className="form-label">Departure port</label>
          <input
            name="travel1"
            defaultValue={ticket?.travel1}
            type="text"
            {...register("travel1")}
            className={`form-control ${errors.travel1 ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.travel1?.message}</div>
        </div>
        <div className="mb-3 col">
          <label className="form-label">Arrival port</label>
          <input
            name="travel2"
            defaultValue={ticket?.travel2}
            type="text"
            {...register("travel2")}
            className={`form-control ${errors.travel2 ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.travel1?.message}</div>
        </div>
      </div>

      <div className="row">
        <div className="mb-3 col">
          <label className="form-label">Dates</label>
          <input
            name="dates"
            defaultValue={ticket?.dates}
            type="text"
            {...register("dates")}
            className={`form-control ${errors.dates ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.dates?.message}</div>
        </div>
        <div className="mb-3 col">
          <label className="form-label">Phone</label>
          <input
            name="phone"
            defaultValue={ticket?.phone}
            type="text"
            {...register("phone")}
            className={`form-control ${errors.phone ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.phone?.message}</div>
        </div>
      </div>

      <div className="row">
        <div className="mb-3 col">
          <label className="form-label">Card Number</label>
          <input
            name="card"
            defaultValue={ticket?.cardNumber}
            type="text"
            {...register("card")}
            className={`form-control ${errors.card ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.card?.message}</div>
        </div>
        <div className="mb-3 col">
          <label className="form-label">Flight Number</label>
          <input
            name="flight"
            defaultValue={ticket?.flight}
            type="text"
            {...register("flight")}
            className={`form-control ${errors.flight ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.flight?.message}</div>
        </div>
        <div className="mb-3 col">
          <label className="form-label">Paid By Agent (Transfer)</label>
          <input
            name="paidByAgent"
            defaultValue={ticket?.paidByAgent || 0}
            type="number"
            step="0.01"
            {...register("paidByAgent")}
            className={`form-control ${errors.paidByAgent ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.paidByAgent?.message}</div>
        </div>
      </div>

      <div className="row">
        <div className="mb-3 col">
          <label className="form-label">Receiving Amount 2</label>
          <input
            name="receivingAmount2"
            defaultValue={ticket?.receivingAmount2}
            type="number"
            step="0.01"
            {...register("receivingAmount2")}
            className={`form-control ${
              errors.receivingAmount2 ? "is-invalid" : ""
            }`}
          />
          <div className="invalid-feedback">
            {errors.receivingAmount2?.message}
          </div>
        </div>
        <div className="mb-3 col">
          <label className="form-label">Receiving Amount 2 Date</label>
          <input
            name="receivingAmount2Date"
            defaultValue={ticket?.receivingAmount2Date}
            type="date"
            {...register("receivingAmount2Date")}
            className={`form-control ${
              errors.receivingAmount2Date ? "is-invalid" : ""
            }`}
          />
          <div className="invalid-feedback">
            {errors.receivingAmount2Date?.message}
          </div>
        </div>
        <div className="mb-3 col-md-4 col-sm-6">
          <label className="form-label">Payment Method 2</label>
          <input
            name="receivingAmount2Method"
            defaultValue={ticket?.receivingAmount2Method}
            type="text"
            {...register("receivingAmount2Method")}
            className={`form-control ${
              errors.receivingAmount2Method ? "is-invalid" : ""
            }`}
          />
          <div className="invalid-feedback">
            {errors.receivingAmount2Method?.message}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="mb-3 col">
          <label className="form-label">Receiving Amount 3</label>
          <input
            name="receivingAmount3"
            defaultValue={ticket?.receivingAmount3}
            type="number"
            step="0.01"
            {...register("receivingAmount3")}
            className={`form-control ${
              errors.receivingAmount3 ? "is-invalid" : ""
            }`}
          />
          <div className="invalid-feedback">
            {errors.receivingAmount3?.message}
          </div>
        </div>
        <div className="mb-3 col">
          <label className="form-label">ReceivingAmount 3 Date</label>
          <input
            name="receivingAmount3Date"
            defaultValue={ticket?.receivingAmount3Date}
            type="date"
            {...register("receivingAmount3Date")}
            className={`form-control ${
              errors.receivingAmount3Date ? "is-invalid" : ""
            }`}
          />
          <div className="invalid-feedback">
            {errors.receivingAmount3Date?.message}
          </div>
        </div>
        <div className="mb-3 col-md-4 col-sm-6">
          <label className="form-label">Payment Method 3</label>
          <input
            name="receivingAmount3Method"
            defaultValue={ticket?.receivingAmount3Method}
            type="text"
            {...register("receivingAmount3Method")}
            className={`form-control ${
              errors.receivingAmount3Method ? "is-invalid" : ""
            }`}
          />
          <div className="invalid-feedback">
            {errors.receivingAmount3Method?.message}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="mb-3 col">
          <label className="form-label">Refund</label>
          <input
            name="refund"
            defaultValue={ticket?.refund}
            type="number"
            step="0.01"
            {...register("refund")}
            className={`form-control ${errors.refund ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.refund?.message}</div>
        </div>
        <div className="mb-3 col">
          <label className="form-label">Refund Date</label>
          <input
            name="refundDate"
            defaultValue={ticket?.refundDate}
            type="date"
            {...register("refundDate")}
            className={`form-control ${errors.refundDate ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.refundDate?.message}</div>
        </div>
        <div className="mb-3 col-md-4 col-sm-6">
          <label className="form-label">Paid Supplier</label>
          <input
            name="supplied"
            defaultValue={ticket?.supplied}
            type="number"
            step="0.01"
            {...register("supplied")}
            className={`form-control ${errors.supplied ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.supplied?.message}</div>
        </div>
      </div>

      <div className="row">
        <div className="mb-3 col-md-4 col-sm-6">
          <label className="form-label">Refund Used</label>
          <input
            name="refundUsed"
            defaultValue={ticket?.refundUsed}
            type="number"
            step="0.01"
            {...register("refundUsed")}
            className={`form-control ${errors.refundUsed ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.refundUsed?.message}</div>
        </div>
        <div className="mb-3 col">
          <label className="form-label">Returned Customer</label>
          <input
            name="returned"
            defaultValue={ticket?.returned}
            type="number"
            step="0.01"
            {...register("returned")}
            className={`form-control ${errors.returned ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.returned?.message}</div>
        </div>
        <div className="mb-3 col">
          <label className="form-label">Returned Date</label>
          <input
            name="returnedDate"
            defaultValue={ticket?.returnedDate}
            type="date"
            {...register("returnedDate")}
            className={`form-control ${
              errors.returnedDate ? "is-invalid" : ""
            }`}
          />
          <div className="invalid-feedback">{errors.returnedDate?.message}</div>
        </div>
      </div>
      <div className="mb-3 col">
        <label className="form-label">Extra Notes</label>
        <textarea
          name="desc"
          defaultValue={ticket?.desc}
          {...register("desc")}
          className={`form-control ${errors.desc ? "is-invalid" : ""}`}
        />
        <div className="invalid-feedback">{errors.desc?.message}</div>
      </div>
      <div className="row">
        <div className="mb-3">
          <button
            type="submit"
            disabled={formState.isSubmitting}
            className="btn btn-primary me-2"
          >
            {formState.isSubmitting && (
              <span className="spinner-border spinner-border-sm me-1"></span>
            )}
            Save
          </button>
          <Link href="/tickets" className="btn btn-link">
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}
