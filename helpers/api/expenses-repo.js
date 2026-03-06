import { db } from "helpers/api";

const Expenses = db.Expenses;

export const expensesRepo = {
  getAll,
  getById,
  create,
  update,
  delete: _delete,
};

async function getAll(filters) {
  let filter = {
    [filters.type]: { $gte: filters.start, $lte: filters.end },
  };
  return await Expenses.find(filter).sort({ createdAt: -1 });
}

async function getById(id) {
  return await Expenses.findById(id);
}

async function create(params) {
  const expense = new Expenses(params);
  await expense.save();
}

async function update(id, params) {
  await Expenses.findByIdAndUpdate(id, params);
}

async function _delete(id) {
  await Expenses.findByIdAndRemove(id);
}
