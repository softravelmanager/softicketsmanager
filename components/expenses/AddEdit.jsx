import Link from "next/link";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

import {
  expensesService,
  alertService,
  formatDate,
  categories,
} from "services";

export { AddEdit };

function AddEdit(props) {
  const expense = props?.expense;
  // form validation rules
  const validationSchema = Yup.object().shape({
    title: Yup.string().required("Title is required"),
    desc: Yup.string().notRequired(),
    category: Yup.string().required("Category is required"),
    subcategory: Yup.string().notRequired(),
    type: Yup.string().required("Type is required"), // ingress - egress
    paymentMethod: Yup.string().required("Payment Method is required"),
    amount: Yup.string().required("Amount is required"),
    paymentDate: Yup.date().required("Payment date is required"),
    status: Yup.string().notRequired(), // completed - pending
  });
  const formOptions = { resolver: yupResolver(validationSchema) };

  // get functions to build form with useForm() hook
  const { register, handleSubmit, reset, formState } = useForm(formOptions);
  const { errors } = formState;

  async function onSubmit(data) {
    alertService.clear();
    try {
      // create or update user based on expenseNew prop
      let expenseNew = {
        title: data.title,
        desc: data.desc,
        category: data.category,
        subcategory: data.subcategory || "",
        type: data.type,
        paymentMethod: data.paymentMethod,
        amount: data.amount,
        paymentDate: formatDate(data.paymentDate),
        status: data.status,
      };
      console.log(expense, expenseNew);
      if (!expense) {
        await expensesService.create(expenseNew);
        document.getElementById("add-form").reset();
        reset({
          title: "",
          desc: "",
          category: "",
          subcategory: "",
          type: "",
          paymentMethod: "",
          amount: "",
          paymentDate: "",
          status: "",
        });
        alertService.success(
          "Expense " + expenseNew.title + " added successfully",
          true
        );
      } else {
        await expensesService.update(expense.id, expenseNew);
        alertService.success(
          "Expense " + expenseNew.title + " updated successfully"
        );
      }
    } catch (error) {
      alertService.error(error);
      console.error(error);
    }
  }

  return (
    <form id="add-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="row">
        <div className="mb-3 col">
          <label className="form-label">
            Title <span className="text-danger">*</span>
          </label>
          <input
            name="title"
            defaultValue={expense?.title}
            type="text"
            {...register("title")}
            className={`form-control ${errors.title ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.title?.message}</div>
        </div>
        <div className="mb-3 col">
          <label className="form-label">
            Category <span className="text-danger">*</span>
          </label>
          <select
            name="category"
            defaultValue={expense?.category}
            {...register("category")}
            className={`form-control ${errors.category ? "is-invalid" : ""}`}
          >
            {categories.map((category, index) => {
              return (
                <option key={"k" + index} value={category.key}>
                  {category.text}
                </option>
              );
            })}
          </select>
          <div className="invalid-feedback">{errors.category?.message}</div>
        </div>
      </div>

      <div className="row">
        <div className="mb-3 col">
          <label className="form-label">
            Type <span className="text-danger">*</span>
          </label>
          <select
            name="type"
            defaultValue={expense?.type}
            {...register("type")}
            className={`form-control ${errors.type ? "is-invalid" : ""}`}
          >
            <option>Egress</option>
            <option>Ingress</option>
          </select>
          <div className="invalid-feedback">{errors.type?.message}</div>
        </div>
        <div className="mb-3 col">
          <label className="form-label">
            Payment Method <span className="text-danger">*</span>
          </label>
          <input
            name="paymentMethod"
            defaultValue={expense?.paymentMethod}
            type="text"
            {...register("paymentMethod")}
            className={`form-control ${
              errors.paymentMethod ? "is-invalid" : ""
            }`}
          />
          <div className="invalid-feedback">
            {errors.paymentMethod?.message}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="mb-3 col">
          <label className="form-label">
            Amount <span className="text-danger">*</span>
          </label>
          <input
            name="amount"
            defaultValue={expense?.amount}
            type="number"
            step="0.01"
            min="0"
            {...register("amount")}
            className={`form-control ${errors.amount ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.card?.message}</div>
        </div>
        <div className="mb-3 col">
          <label className="form-label">
            Payment Date <span className="text-danger">*</span>
          </label>
          <input
            name="paymentDate"
            defaultValue={expense?.paymentDate}
            type="date"
            {...register("paymentDate")}
            className={`form-control ${errors.paymentDate ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.paymentDate?.message}</div>
        </div>
      </div>

      <div className="row">
        <div className="mb-3 col">
          <label className="form-label">Sub Category</label>
          <input
            name="subcategory"
            defaultValue={expense?.subcategory}
            type="text"
            {...register("subcategory")}
            className={`form-control ${errors.subcategory ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.subcategory?.message}</div>
        </div>
        <div className="mb-3 col">
          <label className="form-label">Status</label>
          <select
            name="status"
            defaultValue={expense?.status}
            {...register("status")}
            className={`form-control ${errors.status ? "is-invalid" : ""}`}
          >
            <option>Completed</option>
            <option>Pending</option>
          </select>
          <div className="invalid-feedback">{errors.status?.message}</div>
        </div>
      </div>

      <div className="row">
        <div className="mb-3 col">
          <label className="form-label">Description</label>
          <textarea
            name="desc"
            defaultValue={expense?.desc}
            type="textarea"
            {...register("desc")}
            className={`form-control ${errors.desc ? "is-invalid" : ""}`}
          />
          <div className="invalid-feedback">{errors.desc?.message}</div>
        </div>
      </div>

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
        <Link href="/expenses" className="btn btn-link">
          Cancel
        </Link>
      </div>
    </form>
  );
}
