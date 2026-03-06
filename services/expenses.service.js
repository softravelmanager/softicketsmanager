import { fetchWrapper } from "helpers";
import { formatDate } from "./index";

const baseUrl = `/api/expenses`;

export const expensesService = {
  getAll,
  create,
  update,
  delete: _delete,
  getById,
};

export const categories = [
  { key: 1, text: "Others" },
  { key: 2, text: "Bank fees" },
  { key: 3, text: "Rent" },
  { key: 4, text: "Travel" },
  { key: 5, text: "Telephone" },
  { key: 6, text: "Client gifts" },
  { key: 7, text: "Office expenses and supplies" },
  { key: 8, text: "Insurance" },
  { key: 9, text: "Maintenance and repairs" },
  { key: 10, text: "Legal and professional expenses" },
  { key: 11, text: "Advertising" },
  { key: 12, text: "Licenses and permits" },
  { key: 13, text: "Utilities" },
  { key: 14, text: "Business meals" },
  { key: 15, text: "Course" },
  { key: 16, text: "Credit and collection fees" },
  { key: 17, text: "Subscriptions" },
  { key: 18, text: "Moving expenses" },
  { key: 19, text: "Software" },
  { key: 20, text: "Medical expenses" },
];

async function getAll(filters) {
  const response = await fetchWrapper.post(baseUrl, filters);
  const expenses = response.map((t, i) => {
    let categoryName = categories.filter(
      (cat) => cat.key === parseInt(t.category)
    );
    let paymentDate = formatDate(t.paymentDate, "IT");
    return {
      ...t,
      idP: i + 1,
      amount: "€ " + parseFloat(t.amount),
      paymentDate,
      category: categoryName.length ? categoryName[0]["text"] : "-",
    };
  });
  return expenses;
}

async function create(expense) {
  await fetchWrapper.post(`${baseUrl}/create`, expense);
}

async function update(id, params) {
  await fetchWrapper.put(`${baseUrl}/${id}`, params);
}

async function _delete(id) {
  await fetchWrapper.delete(`${baseUrl}/${id}`);
}

async function getById(id) {
  return await fetchWrapper.get(`${baseUrl}/${id}`);
}
